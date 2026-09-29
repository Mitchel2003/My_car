import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Rotate3d, Sparkles, CheckCircle2, RefreshCw, ZoomIn } from 'lucide-react';

export function VisorAuto3D({ adicionales = [], modeloVehiculo = 'Vehículo', placa = '' }) {
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const autoRotateRef = useRef(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [cargandoModelo, setCargandoModelo] = useState(false);
  const [zonaActiva, setZonaActiva] = useState('frenos_delanteros');
  const [estiloVisual, setEstiloVisual] = useState('clay'); // 'clay' | 'metalico' | 'rayosx'
  const estiloVisualRef = useRef(estiloVisual);

  // Refs para animación suave de cámara
  const targetCamPosRef = useRef(new THREE.Vector3(-4.0, 2.5, 4.2));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0.45, 0));

  // Colecciones de mallas clasificadas para cambio instantáneo de materiales
  const meshGroupsRef = useRef({
    body: [],
    glass: [],
    rims: [],
    tires: [],
    brakes: []
  });

  // Analizar ítems reales de la orden técnica
  const analisisZonas = useMemo(() => {
    const todosLosItems = adicionales.flatMap(ad => ad.items || []);

    const buscar = (palabras) => todosLosItems.filter(it => 
      palabras.some(p => it.descripcion.toLowerCase().includes(p.toLowerCase()))
    );

    const frenosDel = buscar(['freno', 'pastilla', 'disco', 'delanter']);
    const suspension = buscar(['suspens', 'amortiguador', 'alineac', 'balanceo', 'direccion']);
    const motor = buscar(['aceite', 'filtro', 'motor', 'refrigerante', 'liquido']);
    const frenosTras = buscar(['freno trasero', 'campana', 'banda']);

    const calcularEstado = (items) => {
      if (!items || items.length === 0) return { estado: 'NORMAL', etiqueta: 'Verificado', color: '#10b981', colorHex: 0x10b981 };
      if (items.some(i => i.estado === 'PENDIENTE')) return { estado: 'PENDIENTE', etiqueta: 'Cotización Pendiente', color: '#f59e0b', colorHex: 0xf59e0b };
      if (items.some(i => i.estado === 'APROBADO')) return { estado: 'APROBADO', etiqueta: 'En Reparación', color: '#38bdf8', colorHex: 0x38bdf8 };
      return { estado: 'RECHAZADO', etiqueta: 'Descartado', color: '#64748b', colorHex: 0x64748b };
    };

    return {
      frenos_delanteros: {
        id: 'frenos_delanteros',
        nombre: 'Frenos Delanteros',
        subtitulo: 'Sistema de Seguridad Crítica',
        descripcion: 'Discos ventilados, mordazas hidráulicas y pastillas cerámicas.',
        items: frenosDel,
        posicion3D: [0.95, 0.36, -1.18],
        camPos: [2.1, 0.9, -1.8],
        camTarget: [0.8, 0.36, -1.18],
        ...calcularEstado(frenosDel)
      },
      suspension_direccion: {
        id: 'suspension_direccion',
        nombre: 'Suspensión y Dirección',
        subtitulo: 'Tren Delantero y Geometría',
        descripcion: 'Amortiguadores hidráulicos, espirales, tijeras de suspensión y alineación.',
        items: suspension,
        posicion3D: [0, 0.45, -1.0],
        camPos: [1.8, 1.2, -1.3],
        camTarget: [0, 0.45, -1.0],
        ...calcularEstado(suspension)
      },
      motor_fluidos: {
        id: 'motor_fluidos',
        nombre: 'Motor y Compartimiento Mecánico',
        subtitulo: 'Mecánica y Lubricación',
        descripcion: 'Bloque motor, lubricante sintético, filtro y niveles de fluidos esenciales.',
        items: motor,
        posicion3D: [0, 0.72, -1.55],
        camPos: [0, 2.2, -3.2],
        camTarget: [0, 0.65, -1.55],
        ...calcularEstado(motor)
      },
      frenos_traseros: {
        id: 'frenos_traseros',
        nombre: 'Frenos y Eje Trasero',
        subtitulo: 'Frenado Auxiliar',
        descripcion: 'Sistema de discos/campanas traseras y freno de estacionamiento.',
        items: frenosTras,
        posicion3D: [0.95, 0.36, 1.48],
        camPos: [2.1, 0.9, 1.8],
        camTarget: [0.8, 0.36, 1.48],
        ...calcularEstado(frenosTras)
      }
    };
  }, [adicionales]);

  const zonaSeleccionadaInfo = analisisZonas[zonaActiva] || analisisZonas.frenos_delanteros;

  // Actualizar rotación automática
  useEffect(() => {
    autoRotateRef.current = autoRotate;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Aplicar materiales según el estilo visual
  const aplicarEstiloVisual = (estilo) => {
    const groups = meshGroupsRef.current;

    // 1. Material Carrocería
    let bodyMat;
    if (estilo === 'clay') {
      // Estudio Clay blanco impoluto idéntico a la imagen de referencia
      bodyMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.34,
        metalness: 0.04,
        flatShading: false
      });
    } else if (estilo === 'metalico') {
      // Azul metalizado showroom de Mi Carro al Día
      bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        roughness: 0.18,
        metalness: 0.85
      });
    } else {
      // Rayos X / Holograma diagnóstico
      bodyMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.18
      });
    }

    // 2. Material Vidrios
    const glassMat = estilo === 'rayosx'
      ? new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.1 })
      : new THREE.MeshStandardMaterial({
          color: estilo === 'clay' ? 0x94a3b8 : 0x0f172a,
          roughness: 0.12,
          metalness: estilo === 'clay' ? 0.2 : 0.85,
          transparent: true,
          opacity: estilo === 'clay' ? 0.75 : 0.85
        });

    // 3. Material Llantas / Rines
    const rimMat = new THREE.MeshStandardMaterial({
      color: estilo === 'clay' ? 0xe2e8f0 : 0xf8fafc,
      roughness: estilo === 'clay' ? 0.32 : 0.2,
      metalness: estilo === 'clay' ? 0.25 : 0.85
    });

    // 4. Material Neumáticos
    const tireMat = new THREE.MeshStandardMaterial({
      color: estilo === 'clay' ? 0x334155 : 0x0f172a,
      roughness: 0.85,
      metalness: 0.05
    });

    // 5. Material Frenos / Cáliper
    const brakeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: estilo === 'rayosx' ? 0.8 : 0.4,
      roughness: 0.3,
      metalness: 0.7
    });

    groups.body.forEach(m => { if (m) m.material = bodyMat; });
    groups.glass.forEach(m => { if (m) m.material = glassMat; });
    groups.rims.forEach(m => { if (m) m.material = rimMat; });
    groups.tires.forEach(m => { if (m) m.material = tireMat; });
    groups.brakes.forEach(m => { if (m) m.material = brakeMat; });
  };

  useEffect(() => {
    estiloVisualRef.current = estiloVisual;
    aplicarEstiloVisual(estiloVisual);
  }, [estiloVisual]);

  // Mover cámara a la zona seleccionada
  useEffect(() => {
    const zona = analisisZonas[zonaActiva];
    if (zona && zona.camPos && zona.camTarget) {
      targetCamPosRef.current.set(...zona.camPos);
      targetLookAtRef.current.set(...zona.camTarget);
    }
  }, [zonaActiva, analisisZonas]);

  // Función para construir el sedán procedural de alta fidelidad (render inmediato garantizado)
  const crearAutoProcedural = (bodyMat, glassMat, rimMat, tireMat, caliperMat) => {
    const carGroup = new THREE.Group();
    carGroup.name = 'auto_procedural';

    // 1. Chasis / Carrocería inferior con perfil aerodinámico
    const chassisGeo = new THREE.BoxGeometry(1.82, 0.44, 4.3, 4, 2, 8);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.set(0, 0.44, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    carGroup.add(chassis);

    // 2. Capó aerodinámico inclinado
    const hoodGeo = new THREE.BoxGeometry(1.72, 0.22, 1.25);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.58, -1.35);
    hood.rotation.x = -0.09;
    hood.castShadow = true;
    carGroup.add(hood);

    // 3. Baúl trasero con caída suave
    const trunkGeo = new THREE.BoxGeometry(1.7, 0.24, 1.05);
    const trunk = new THREE.Mesh(trunkGeo, bodyMat);
    trunk.position.set(0, 0.62, 1.55);
    trunk.rotation.x = 0.08;
    trunk.castShadow = true;
    carGroup.add(trunk);

    // 4. Cabina / Techo curvado aerodinámico (Perfil sedán deportivo tipo Audi/Tesla)
    const cabinShape = new THREE.Shape();
    cabinShape.moveTo(-0.8, 0);
    cabinShape.lineTo(-0.76, 0.22);
    cabinShape.quadraticCurveTo(-0.55, 0.78, 0, 0.8);
    cabinShape.quadraticCurveTo(0.55, 0.78, 0.76, 0.22);
    cabinShape.lineTo(0.8, 0);
    cabinShape.closePath();

    const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, {
      steps: 3,
      depth: 2.2,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.1,
      bevelSegments: 4
    });
    cabinGeo.center();
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 0.92, 0.08);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // 5. Parabrisas delantero inclinado
    const frontWindshieldGeo = new THREE.BoxGeometry(1.42, 0.56, 0.68);
    const frontWindshield = new THREE.Mesh(frontWindshieldGeo, glassMat);
    frontWindshield.position.set(0, 0.85, -0.78);
    frontWindshield.rotation.x = Math.PI / 4.6;
    carGroup.add(frontWindshield);

    // 6. Luneta trasera inclinada
    const rearWindshieldGeo = new THREE.BoxGeometry(1.38, 0.52, 0.75);
    const rearWindshield = new THREE.Mesh(rearWindshieldGeo, glassMat);
    rearWindshield.position.set(0, 0.86, 0.98);
    rearWindshield.rotation.x = -Math.PI / 4.4;
    carGroup.add(rearWindshield);

    // 7. Espejos retrovisores
    [-0.98, 0.98].forEach(x => {
      const mirrorGeo = new THREE.BoxGeometry(0.18, 0.12, 0.22);
      const mirror = new THREE.Mesh(mirrorGeo, bodyMat);
      mirror.position.set(x, 0.78, -0.6);
      mirror.castShadow = true;
      carGroup.add(mirror);
    });

    // 8. 4 Ruedas completas con rines deportivos de 5 radios y frenos visibles
    const wheelPositions = [
      { x: 0.92, z: -1.18, isFront: true },  // Frontal Derecha
      { x: -0.92, z: -1.18, isFront: true }, // Frontal Izquierda
      { x: 0.92, z: 1.48, isFront: false },  // Trasera Derecha
      { x: -0.92, z: 1.48, isFront: false }  // Trasera Izquierda
    ];

    wheelPositions.forEach(({ x, z }) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(x, 0.36, z);

      // Neumático
      const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 28);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      // Llanta / Rim
      const rimGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.245, 24);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      // 5 Radios estilo Audi
      for (let i = 0; i < 5; i++) {
        const spokeGeo = new THREE.BoxGeometry(0.04, 0.24, 0.03);
        const spoke = new THREE.Mesh(spokeGeo, rimMat);
        const angle = (i * Math.PI * 2) / 5;
        spoke.position.set(x > 0 ? 0.11 : -0.11, Math.cos(angle) * 0.12, Math.sin(angle) * 0.12);
        spoke.rotation.x = angle;
        wheelGroup.add(spoke);
      }

      // Disco de freno metálico
      const discGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.03, 20);
      const discMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.9 });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.rotation.z = Math.PI / 2;
      disc.position.x = x > 0 ? 0.04 : -0.04;
      wheelGroup.add(disc);

      // Cáliper de freno luminoso
      const caliperGeo = new THREE.BoxGeometry(0.08, 0.14, 0.09);
      const caliper = new THREE.Mesh(caliperGeo, caliperMat);
      caliper.position.set(x > 0 ? 0.06 : -0.06, 0.11, 0.08);
      wheelGroup.add(caliper);

      carGroup.add(wheelGroup);
    });

    return carGroup;
  };

  // Inicializar escena Three.js
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Escena y Fondo de Estudio
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // Suave tono estudio con contraste

    const width = container.clientWidth || 600;
    const height = 400;

    // 2. Cámara (Ángulo isométrico 3/4 idéntico al render de referencia)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(-4.0, 2.5, 4.2);
    cameraRef.current = camera;

    // 3. Renderer WebGL con mapeo de tonos y sombras de alta fidelidad
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    // 4. OrbitControls con damping suave
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // No traspasar el suelo
    controls.minDistance = 2.5;
    controls.maxDistance = 8.5;
    controls.autoRotate = autoRotateRef.current;
    controls.autoRotateSpeed = 1.2;
    controls.target.set(0, 0.45, 0);
    controlsRef.current = controls;

    // 5. Iluminación de Estudio Fotográfico Automotriz (Key + Fill + Rim + Ground Ambient)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Luz principal cenital posterior (genera los reflejos en el techo y laterales como en la foto)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(-5, 9, -5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -3.5;
    keyLight.shadow.camera.right = 3.5;
    keyLight.shadow.camera.top = 3.5;
    keyLight.shadow.camera.bottom = -3.5;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    // Luz frontal suave de relleno
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.1);
    fillLight.position.set(5, 5, 5);
    scene.add(fillLight);

    // Luz hemisférica para volumen en el chasis
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcfd8dc, 0.8);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    // 6. Suelo de estudio infinito receptor de sombras
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.25 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Sombra de contacto suave en el piso (Ambient Occlusion suelo)
    const contactCanvas = document.createElement('canvas');
    contactCanvas.width = 128;
    contactCanvas.height = 128;
    const ctx = contactCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
    grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.22)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const contactTexture = new THREE.CanvasTexture(contactCanvas);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: contactTexture,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4.8), contactShadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.01;
    scene.add(contactShadow);

    // 7. Contenedor de auto: montamos de inmediato el modelo procedural para visualización instantánea
    const carContainer = new THREE.Group();
    scene.add(carContainer);

    // Materiales iniciales
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.34, metalness: 0.04 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.75 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.32, metalness: 0.25 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.05 });
    const caliperMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.7 });

    const autoProcedural = crearAutoProcedural(bodyMat, glassMat, rimMat, tireMat, caliperMat);
    carContainer.add(autoProcedural);

    // Clasificar mallas del procedural
    const groups = {
      body: [],
      glass: [],
      rims: [],
      tires: [],
      brakes: []
    };

    autoProcedural.traverse((child) => {
      if (child.isMesh) {
        if (child.material === glassMat) groups.glass.push(child);
        else if (child.material === rimMat) groups.rims.push(child);
        else if (child.material === tireMat) groups.tires.push(child);
        else if (child.material === caliperMat) groups.brakes.push(child);
        else groups.body.push(child);
      }
    });

    meshGroupsRef.current = groups;
    aplicarEstiloVisual(estiloVisualRef.current);

    // 8. Intentar cargar modelo GLTF con DRACOLoader (para reemplazar con modelo de ultra-alta fidelidad)
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      '/car.glb',
      (gltf) => {
        const model = gltf.scene;

        // Bounding box y centrado
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = 4.2 / maxDim;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        model.position.x = -center.x * scaleFactor;
        model.position.y = -box.min.y * scaleFactor;
        model.position.z = -center.z * scaleFactor;

        const gltfGroups = {
          body: [],
          glass: [],
          rims: [],
          tires: [],
          brakes: []
        };

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            const name = (child.name || '').toLowerCase();
            if (name.includes('glass') || name.includes('windshield') || name.includes('window')) {
              gltfGroups.glass.push(child);
            } else if (name.includes('tire') || name.includes('wheel')) {
              gltfGroups.tires.push(child);
            } else if (name.includes('rim') || name.includes('chrome') || name.includes('metal')) {
              gltfGroups.rims.push(child);
            } else if (name.includes('brake') || name.includes('caliper')) {
              gltfGroups.brakes.push(child);
            } else {
              gltfGroups.body.push(child);
            }
          }
        });

        // Reemplazar auto procedural con el modelo GLTF decodificado
        carContainer.remove(autoProcedural);
        carContainer.add(model);
        meshGroupsRef.current = gltfGroups;
        aplicarEstiloVisual(estiloVisualRef.current);
        setCargandoModelo(false);
      },
      undefined,
      (err) => {
        console.info('Manteniendo modelo 3D nativo optimizado:', err?.message || err);
        setCargandoModelo(false);
      }
    );

    // 9. Marcadores 3D flotantes con anillos de pulsación diagnóstica
    const markersGroup = new THREE.Group();
    Object.values(analisisZonas).forEach((zona) => {
      const [mx, my, mz] = zona.posicion3D;

      // Núcleo luminoso
      const markerGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: zona.colorHex });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(mx, my, mz);
      marker.userData = { id: zona.id };

      // Halo pulsante
      const ringGeo = new THREE.RingGeometry(0.11, 0.16, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: zona.colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(mx, my, mz);
      ring.userData = { id: zona.id, isRing: true };

      markersGroup.add(marker);
      markersGroup.add(ring);
    });
    scene.add(markersGroup);

    // 10. Raycasting para interacción táctil/clic en marcadores
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerDown = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(markersGroup.children);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.id) {
          setZonaActiva(hit.userData.id);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 11. Bucle de renderizado 60 FPS con interpolación suave de cámara
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Animación pulsante de los halos
      markersGroup.children.forEach((child, idx) => {
        if (child.userData.isRing) {
          const scale = 1 + Math.sin(elapsed * 3.5 + idx) * 0.25;
          child.scale.set(scale, scale, scale);
          child.lookAt(camera.position);
        }
      });

      // Suavizado cinemático al cambiar de zona
      controls.target.lerp(targetLookAtRef.current, 0.05);
      if (!autoRotateRef.current) {
        camera.position.lerp(targetCamPosRef.current, 0.04);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 12. Manejo responsivo del tamaño
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 600;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      dracoLoader.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [analisisZonas]);

  // Restablecer ángulo de cámara
  const resetearCamara = (vista) => {
    if (!controlsRef.current || !cameraRef.current) return;
    const ctrl = controlsRef.current;
    if (vista === 'isometrica') {
      targetCamPosRef.current.set(-4.0, 2.5, 4.2);
      targetLookAtRef.current.set(0, 0.45, 0);
    } else if (vista === 'lateral') {
      targetCamPosRef.current.set(4.5, 1.2, 0);
      targetLookAtRef.current.set(0, 0.45, 0);
    } else if (vista === 'frontal') {
      targetCamPosRef.current.set(0, 1.5, -4.5);
      targetLookAtRef.current.set(0, 0.45, 0);
    }
    ctrl.update();
  };

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-200 mb-6 overflow-hidden">
      {/* Cabecera del Visor 3D */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Visor 3D Real de Estudio (WebGL Three.js)
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Modelo 3D de tu {modeloVehiculo}
            {placa && (
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-300">
                Placa: {placa}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Arrastrá con el dedo o mouse para girar 360°, hacé zoom o tocá los marcadores de diagnóstico.
          </p>
        </div>

        {/* Controles de Giro y Reset */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition min-h-[38px] ${
              autoRotate ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Pausar o reanudar rotación 360°"
          >
            <Rotate3d className="w-4 h-4" />
            <span>{autoRotate ? 'Giro 360° On' : 'Pausado'}</span>
          </button>

          <button
            onClick={() => resetearCamara('isometrica')}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Restablecer perspectiva de estudio"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenedor del Canvas WebGL */}
      <div className="relative my-3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center min-h-[380px]">
        <div ref={mountRef} className="w-full cursor-grab active:cursor-grabbing touch-none" />

        {/* Indicador de Carga */}
        {cargandoModelo && (
          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-700">Cargando modelo 3D de alta fidelidad...</span>
          </div>
        )}

        {/* Indicador de interacción */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 shadow-sm flex items-center gap-1.5 pointer-events-none">
          <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
          <span>Arrastrá para rotar 360° · Rueda para zoom</span>
        </div>

        {/* Selector de Shaders / Estilos */}
        <div className="absolute top-3 right-3 flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setEstiloVisual('clay')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              estiloVisual === 'clay' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clay Blanco
          </button>
          <button
            onClick={() => setEstiloVisual('metalico')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              estiloVisual === 'metalico' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Azul Metálico
          </button>
          <button
            onClick={() => setEstiloVisual('rayosx')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              estiloVisual === 'rayosx' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rayos X 3D
          </button>
        </div>
      </div>

      {/* Tarjeta de Diagnóstico del Componente Activo */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">
              {zonaSeleccionadaInfo.subtitulo}
            </span>
            <h4 className="text-lg font-bold text-slate-900">
              {zonaSeleccionadaInfo.nombre}
            </h4>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
            zonaSeleccionadaInfo.estado === 'PENDIENTE' 
              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
              : zonaSeleccionadaInfo.estado === 'APROBADO'
              ? 'bg-sky-100 text-sky-800 border border-sky-300'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}>
            {zonaSeleccionadaInfo.etiqueta}
          </span>
        </div>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          {zonaSeleccionadaInfo.descripcion}
        </p>

        {/* Ítems Reales de la OT vinculados a esta zona */}
        <div className="space-y-2 mb-3">
          <span className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
            Repuestos y Servicios Diagnosticados:
          </span>

          {zonaSeleccionadaInfo.items.length > 0 ? (
            zonaSeleccionadaInfo.items.map((it) => (
              <div
                key={it.id}
                className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block text-sm">
                    {it.descripcion}
                  </span>
                  <span className="text-slate-500">
                    Tipo: {it.tipo} · Cantidad: {it.cantidad}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 text-sm block">
                    ${Number(it.valorUnitario || it.valor_unitario || 0).toLocaleString('es-CO')} COP
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    it.estado === 'APROBADO' ? 'bg-sky-100 text-sky-700' :
                    it.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {it.estado}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Esta zona no presenta anomalías ni cotizaciones adicionales en la orden actual.</span>
            </div>
          )}
        </div>

        {/* Botones de Navegación Rápida entre Zonas 3D */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 pr-1">Enfocar pieza:</span>
          {Object.values(analisisZonas).map(z => (
            <button
              key={z.id}
              onClick={() => setZonaActiva(z.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                zonaActiva === z.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {z.nombre}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
