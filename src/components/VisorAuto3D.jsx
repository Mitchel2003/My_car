import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Rotate3d, Sparkles, CheckCircle2, RefreshCw, ZoomIn } from 'lucide-react';


export function VisorAuto3D({ adicionales = [], modeloVehiculo = 'Vehículo', placa = '' }) {
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const autoRotateRef = useRef(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [zonaActiva, setZonaActiva] = useState('frenos_delanteros');
  const [estiloVisual, setEstiloVisual] = useState('clay'); // 'clay' | 'metalico' | 'rayosx'
  const materialsRef = useRef({});

  // Analizar ítems reales de la orden
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
      if (!items || items.length === 0) return { estado: 'NORMAL', etiqueta: 'Verificado', color: '#10b981' };
      if (items.some(i => i.estado === 'PENDIENTE')) return { estado: 'PENDIENTE', etiqueta: 'Cotización Pendiente', color: '#f59e0b' };
      if (items.some(i => i.estado === 'APROBADO')) return { estado: 'APROBADO', etiqueta: 'En Reparación', color: '#38bdf8' };
      return { estado: 'RECHAZADO', etiqueta: 'Descartado', color: '#64748b' };
    };

    return {
      frenos_delanteros: {
        id: 'frenos_delanteros',
        nombre: 'Frenos Delanteros',
        subtitulo: 'Sistema de Seguridad Crítica',
        descripcion: 'Discos ventilados, mordazas y pastillas de fricción cerámica.',
        items: frenosDel,
        posicion3D: [1.1, 0.35, 1.45],
        ...calcularEstado(frenosDel)
      },
      suspension_direccion: {
        id: 'suspension_direccion',
        nombre: 'Suspensión y Dirección',
        subtitulo: 'Tren Delantero y Geometría',
        descripcion: 'Conjunto de amortiguadores, espirales, tijeras y alineación.',
        items: suspension,
        posicion3D: [0, 0.5, 1.3],
        ...calcularEstado(suspension)
      },
      motor_fluidos: {
        id: 'motor_fluidos',
        nombre: 'Motor y Compartimiento Mecánico',
        subtitulo: 'Mecánica y Lubricación',
        descripcion: 'Bloque motor, lubricante sintético, filtro y niveles de fluidos.',
        items: motor,
        posicion3D: [0, 0.75, 1.1],
        ...calcularEstado(motor)
      },
      frenos_traseros: {
        id: 'frenos_traseros',
        nombre: 'Frenos y Eje Trasero',
        subtitulo: 'Frenado Auxiliar',
        descripcion: 'Sistema de discos/campanas traseras y freno de estacionamiento.',
        items: frenosTras,
        posicion3D: [1.1, 0.35, -1.35],
        ...calcularEstado(frenosTras)
      }
    };
  }, [adicionales]);

  const zonaSeleccionadaInfo = analisisZonas[zonaActiva] || analisisZonas.frenos_delanteros;

  useEffect(() => {
    autoRotateRef.current = autoRotate;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Fondo estudio claro tipo render clay

    const width = container.clientWidth || 600;
    const height = 380;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    // Ángulo isométrico idéntico a la imagen de referencia (perspectiva trasera/lateral elevada)
    camera.position.set(-4.5, 2.8, -4.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.appendChild(renderer.domElement);

    // 2. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // No pasar por debajo del suelo
    controls.minDistance = 3.5;
    controls.maxDistance = 10;
    controls.autoRotate = autoRotateRef.current;
    controls.autoRotateSpeed = 1.2;
    controls.target.set(0, 0.5, 0);
    controlsRef.current = controls;

    // 3. Iluminación tipo Estudio Clay (Sombras suaves de producto)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight1.position.set(6, 12, 6);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    dirLight1.shadow.camera.near = 0.5;
    dirLight1.shadow.camera.far = 25;
    dirLight1.shadow.camera.left = -4;
    dirLight1.shadow.camera.right = 4;
    dirLight1.shadow.camera.top = 4;
    dirLight1.shadow.camera.bottom = -4;
    dirLight1.shadow.bias = -0.0005;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xdbeafe, 1.0); // Relleno azulado suave
    dirLight2.position.set(-6, 6, -6);
    scene.add(dirLight2);

    // 4. Suelo de estudio con sombra
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.18 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // 5. Construcción detallada del Sedán 3D (Estilo Clay del render Audi)
    const carGroup = new THREE.Group();

    // Materiales
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.38,
      metalness: 0.08,
      flatShading: false
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.15,
      metalness: 0.6,
      transparent: true,
      opacity: 0.75
    });
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.05
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.3,
      metalness: 0.5
    });
    const caliperMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3
    });

    materialsRef.current = { bodyMat, glassMat, tireMat, rimMat, caliperMat };

    // --- CARROCERÍA PRINCIPAL (Chasis aerodinámico suave) ---
    // A. Chasis inferior / Base
    const lowerBodyGeo = new THREE.BoxGeometry(1.8, 0.45, 4.4, 4, 2, 8);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, bodyMat);
    lowerBody.position.set(0, 0.42, 0);
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    carGroup.add(lowerBody);

    // B. Cabina y Techo curvado (Perfil sedán suave)
    const cabinShape = new THREE.Shape();
    cabinShape.moveTo(-0.8, 0);
    cabinShape.lineTo(-0.75, 0.25);
    cabinShape.quadraticCurveTo(-0.55, 0.8, 0, 0.82);
    cabinShape.quadraticCurveTo(0.55, 0.8, 0.75, 0.25);
    cabinShape.lineTo(0.8, 0);
    cabinShape.closePath();

    const extrudeSettings = {
      steps: 4,
      depth: 2.3,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.12,
      bevelSegments: 4
    };
    const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, extrudeSettings);
    cabinGeo.center();
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 0.88, -0.15);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // C. Parabrisas frontal y trasero (Vidrios integrados)
    const frontWindshieldGeo = new THREE.BoxGeometry(1.4, 0.55, 0.7);
    const frontWindshield = new THREE.Mesh(frontWindshieldGeo, glassMat);
    frontWindshield.position.set(0, 0.82, 0.85);
    frontWindshield.rotation.x = -Math.PI / 4.8;
    carGroup.add(frontWindshield);

    const rearWindshieldGeo = new THREE.BoxGeometry(1.35, 0.5, 0.8);
    const rearWindshield = new THREE.Mesh(rearWindshieldGeo, glassMat);
    rearWindshield.position.set(0, 0.83, -1.05);
    rearWindshield.rotation.x = Math.PI / 4.4;
    carGroup.add(rearWindshield);

    // D. Capó y Baúl
    const hoodGeo = new THREE.BoxGeometry(1.7, 0.22, 1.25);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.58, 1.45);
    hood.rotation.x = 0.08;
    hood.castShadow = true;
    carGroup.add(hood);

    const trunkGeo = new THREE.BoxGeometry(1.68, 0.25, 0.95);
    const trunk = new THREE.Mesh(trunkGeo, bodyMat);
    trunk.position.set(0, 0.62, -1.65);
    trunk.rotation.x = -0.06;
    trunk.castShadow = true;
    carGroup.add(trunk);

    // E. Espejos retrovisores
    [-0.98, 0.98].forEach(x => {
      const mirrorGeo = new THREE.BoxGeometry(0.18, 0.12, 0.22);
      const mirror = new THREE.Mesh(mirrorGeo, bodyMat);
      mirror.position.set(x, 0.78, 0.7);
      mirror.castShadow = true;
      carGroup.add(mirror);
    });

    // F. RUEDAS DEPORTIVAS (4 Ruedas completas con discos y mordazas de freno)
    const posicionesRuedas = [
      { x: 0.92, z: 1.45, esDelantera: true },  // Frontal Derecha
      { x: -0.92, z: 1.45, esDelantera: true }, // Frontal Izquierda
      { x: 0.92, z: -1.35, esDelantera: false }, // Trasera Derecha
      { x: -0.92, z: -1.35, esDelantera: false } // Trasera Izquierda
    ];

    posicionesRuedas.forEach(({ x, z, esDelantera }) => {
      const wheelAssembly = new THREE.Group();
      wheelAssembly.position.set(x, 0.35, z);

      // Neumático de bajo perfil
      const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.24, 28);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelAssembly.add(tire);

      // Llanta deportiva (Rim)
      const rimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.245, 24);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelAssembly.add(rim);

      // 5 Radios (Spokes) estilo Audi
      for (let i = 0; i < 5; i++) {
        const spokeGeo = new THREE.BoxGeometry(0.04, 0.23, 0.03);
        const spoke = new THREE.Mesh(spokeGeo, rimMat);
        const angle = (i * Math.PI * 2) / 5;
        spoke.position.set(x > 0 ? 0.11 : -0.11, Math.cos(angle) * 0.12, Math.sin(angle) * 0.12);
        spoke.rotation.x = angle;
        wheelAssembly.add(spoke);
      }

      // Disco de freno visible detrás de los radios
      const discGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 20);
      const discMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.9 });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.rotation.z = Math.PI / 2;
      disc.position.x = x > 0 ? 0.05 : -0.05;
      wheelAssembly.add(disc);

      // Cáliper / Mordaza de freno (Se ilumina según el estado del freno)
      const caliperGeo = new THREE.BoxGeometry(0.08, 0.14, 0.09);
      const caliper = new THREE.Mesh(caliperGeo, caliperMat);
      caliper.position.set(x > 0 ? 0.06 : -0.06, 0.12, 0.08);
      caliper.name = esDelantera ? 'caliper_frontal' : 'caliper_trasero';
      wheelAssembly.add(caliper);

      carGroup.add(wheelAssembly);
    });

    scene.add(carGroup);

    // 6. Marcadores 3D Pulsantes (Hotspots en el espacio tridimensional)
    const markersGroup = new THREE.Group();
    Object.values(analisisZonas).forEach((zona) => {
      const [mx, my, mz] = zona.posicion3D;

      const markerGeo = new THREE.SphereGeometry(0.09, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ 
        color: zona.color,
        wireframe: false
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(mx, my, mz);

      // Anillo de brillo
      const ringGeo = new THREE.RingGeometry(0.12, 0.16, 24);
      const ringMat = new THREE.MeshBasicMaterial({ 
        color: zona.color, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.8 
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(mx, my, mz);
      ring.lookAt(camera.position);

      marker.userData = { id: zona.id };
      markersGroup.add(marker);
      markersGroup.add(ring);
    });
    scene.add(markersGroup);

    // 7. Raycaster para click en piezas 3D
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markersGroup.children);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.id) {
          setZonaActiva(hit.userData.id);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 8. Bucle de animación (60 FPS con rotación suave)
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Pulsación suave de los marcadores
      markersGroup.children.forEach((child, idx) => {
        if (child.geometry.type === 'RingGeometry') {
          const scale = 1 + Math.sin(elapsedTime * 3 + idx) * 0.25;
          child.scale.set(scale, scale, scale);
          child.lookAt(camera.position);
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize observer
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
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [analisisZonas]);

  // Actualizar materiales al alternar estilo visual
  useEffect(() => {
    const mats = materialsRef.current;
    if (!mats.bodyMat) return;

    if (estiloVisual === 'clay') {
      mats.bodyMat.color.setHex(0xf1f5f9);
      mats.bodyMat.roughness = 0.38;
      mats.bodyMat.metalness = 0.08;
      mats.bodyMat.wireframe = false;
    } else if (estiloVisual === 'metalico') {
      mats.bodyMat.color.setHex(0x3b82f6); // Azul metalizado de Mi Carro al Día
      mats.bodyMat.roughness = 0.2;
      mats.bodyMat.metalness = 0.85;
      mats.bodyMat.wireframe = false;
    } else if (estiloVisual === 'rayosx') {
      mats.bodyMat.color.setHex(0x38bdf8);
      mats.bodyMat.wireframe = true;
    }
  }, [estiloVisual]);

  // Restablecer ángulo de cámara
  const resetearCamara = (vista) => {
    if (!controlsRef.current) return;
    const ctrl = controlsRef.current;
    if (vista === 'isometrica') {
      ctrl.object.position.set(-4.5, 2.8, -4.5);
    } else if (vista === 'frontal') {
      ctrl.object.position.set(0, 1.8, 5.5);
    } else if (vista === 'lateral') {
      ctrl.object.position.set(6, 1.5, 0);
    }
    ctrl.target.set(0, 0.5, 0);
    ctrl.update();
  };

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-200 mb-6 overflow-hidden">
      {/* Cabecera del Visor 3D */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Visor Tridimensional 360° Real (Three.js WebGL)
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Modelo 3D de tu {modeloVehiculo}
            {placa && <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-300">Placa: {placa}</span>}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Arrastra con el dedo o mouse para girar 360°, hacer zoom y tocar los marcadores luminosos.
          </p>
        </div>

        {/* Controles de Vista y Rotación */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition min-h-[38px] ${
              autoRotate ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Pausar o reanudar rotación automática"
          >
            <Rotate3d className="w-4 h-4" />
            <span>{autoRotate ? 'Giro 360° On' : 'Pausado'}</span>
          </button>

          <button
            onClick={() => resetearCamara('isometrica')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Restablecer vista isométrica"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenedor del Canvas WebGL Three.js */}
      <div className="relative my-3 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
        <div ref={mountRef} className="w-full cursor-grab active:cursor-grabbing touch-none" />

        {/* Indicador de Ayuda para Touch / Mouse */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 shadow-sm flex items-center gap-1.5 pointer-events-none">
          <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
          <span>Arrastra para girar · Rueda para zoom</span>
        </div>

        {/* Selector de Shaders / Estilos */}
        <div className="absolute top-3 right-3 flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setEstiloVisual('clay')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
              estiloVisual === 'clay' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clay Blanco
          </button>
          <button
            onClick={() => setEstiloVisual('metalico')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
              estiloVisual === 'metalico' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Azul Metálico
          </button>
          <button
            onClick={() => setEstiloVisual('rayosx')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
              estiloVisual === 'rayosx' ? 'bg-sky-500 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rayos X 3D
          </button>
        </div>
      </div>

      {/* Tarjeta de Detalle del Componente Seleccionado */}
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

        {/* Lista de Ítems Reales de la OT en esta Zona */}
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
              <span>Esta zona no requiere reparaciones adicionales en la orden actual.</span>
            </div>
          )}
        </div>

        {/* Botones de Navegación Rápida entre Zonas */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 pr-1">Ver Zona:</span>
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
