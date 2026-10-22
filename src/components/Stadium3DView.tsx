import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MatchEvent } from '../types/odds';
import { Eye, Sun, Moon, Sparkles, Compass, Maximize2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

interface Stadium3DViewProps {
  matches: MatchEvent[];
  selectedMatchId?: string;
}

type CameraPreset = 'tactical' | 'broadcast' | 'ground' | 'corner';
type LightingPreset = 'night_floodlights' | 'sunset' | 'hologram';

// Reusable scratch vectors outside render loop to prevent garbage collection
const _targetPos = new THREE.Vector3();
const _currentCamPos = new THREE.Vector3();

export const Stadium3DView: React.FC<Stadium3DViewProps> = ({ matches, selectedMatchId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeMatchId, setActiveMatchId] = useState<string>(selectedMatchId || matches[0]?.id || '');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('broadcast');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('night_floodlights');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [showHologramData, setShowHologramData] = useState<boolean>(true);

  const currentMatch = matches.find((m) => m.id === activeMatchId) || matches[0];

  // Refs for animation loop
  const animFrameRef = useRef<number>(0);
  const controlsRef = useRef<{
    targetCamPos: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    currentLookAt: THREE.Vector3;
    isDragging: boolean;
    prevMouseX: number;
    prevMouseY: number;
    rotX: number;
    rotY: number;
    zoom: number;
  }>({
    targetCamPos: new THREE.Vector3(0, 18, 28),
    targetLookAt: new THREE.Vector3(0, 0, 0),
    currentLookAt: new THREE.Vector3(0, 0, 0),
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    rotX: 0.5,
    rotY: 0.3,
    zoom: 30,
  });

  const sceneRefs = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    stadiumGroup: THREE.Group;
    ledTexture: THREE.CanvasTexture | null;
    hologramNodes: THREE.Group;
    dirLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 560;

    // Detect software WebGL guard as instructed by skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return false;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
    camera.position.set(0, 20, 32);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    // 2. Mandatory RoomEnvironment via PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Studio PBR Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x818cf8, 0x0f172a, 0.6);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    dirLight.position.set(18, 30, 20);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -22;
    dirLight.shadow.camera.right = 22;
    dirLight.shadow.camera.top = 22;
    dirLight.shadow.camera.bottom = -22;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    // Subtle blue rim light for stadium grandeur
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-20, 15, -25);
    scene.add(rimLight);

    // 4. Procedural Textures (Grass pitch + LED advertising hoardings)
    // A) Procedural Pitch Texture
    const pitchCanvas = document.createElement('canvas');
    pitchCanvas.width = 1024;
    pitchCanvas.height = 768;
    const ctx = pitchCanvas.getContext('2d')!;

    // Base striped grass
    const stripes = 12;
    const stripeWidth = pitchCanvas.width / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#16a34a';
      ctx.fillRect(i * stripeWidth, 0, stripeWidth, pitchCanvas.height);
    }

    // Pitch Line markings
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;

    // Outer boundary
    const pad = 36;
    ctx.strokeRect(pad, pad, pitchCanvas.width - pad * 2, pitchCanvas.height - pad * 2);

    // Center line
    ctx.beginPath();
    ctx.moveTo(pitchCanvas.width / 2, pad);
    ctx.lineTo(pitchCanvas.width / 2, pitchCanvas.height - pad);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(pitchCanvas.width / 2, pitchCanvas.height / 2, 70, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pitchCanvas.width / 2, pitchCanvas.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Boxes (Left & Right)
    const boxH = 220;
    const boxW = 120;
    const boxY = (pitchCanvas.height - boxH) / 2;
    ctx.strokeRect(pad, boxY, boxW, boxH);
    ctx.strokeRect(pitchCanvas.width - pad - boxW, boxY, boxW, boxH);

    // Penalty D arcs
    ctx.beginPath();
    ctx.arc(pad + boxW, pitchCanvas.height / 2, 45, -Math.PI / 2.7, Math.PI / 2.7);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pitchCanvas.width - pad - boxW, pitchCanvas.height / 2, 45, Math.PI - Math.PI / 2.7, Math.PI + Math.PI / 2.7);
    ctx.stroke();

    const pitchTexture = new THREE.CanvasTexture(pitchCanvas);
    pitchTexture.colorSpace = THREE.SRGBColorSpace;
    pitchTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // B) Animated LED Hoardings Canvas Texture (Showing Betting Scanner & Odds)
    const ledCanvas = document.createElement('canvas');
    ledCanvas.width = 1024;
    ledCanvas.height = 64;
    const ledCtx = ledCanvas.getContext('2d')!;

    const drawLedText = (offset = 0) => {
      ledCtx.fillStyle = '#020617';
      ledCtx.fillRect(0, 0, ledCanvas.width, ledCanvas.height);

      ledCtx.font = 'bold 24px monospace';
      ledCtx.fillStyle = '#10b981';
      const tickerText = '⚡ SCANNER DE APUESTAS ⚡ PINNACLE · BET365 · WILLIAM HILL · BWIN ⚡ VALUE BETS EV+ DETECTADOS ⚡ ARBITRAJE SEGURO ⚡ ';
      const textWidth = ledCtx.measureText(tickerText).width;

      for (let x = -offset % textWidth; x < ledCanvas.width + textWidth; x += textWidth) {
        ledCtx.fillText(tickerText, x, 40);
      }
    };
    drawLedText(0);

    const ledTexture = new THREE.CanvasTexture(ledCanvas);
    ledTexture.colorSpace = THREE.SRGBColorSpace;
    ledTexture.wrapS = THREE.RepeatWrapping;

    // 5. Composite 3-12 Part Stadium Model (THREE.Group)
    const stadiumGroup = new THREE.Group();
    scene.add(stadiumGroup);

    // Part 1: Field Pitch Mesh
    const pitchGeo = new THREE.PlaneGeometry(28, 19);
    const pitchMat = new THREE.MeshStandardMaterial({
      map: pitchTexture,
      roughness: 0.85,
      metalness: 0.05,
    });
    const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.receiveShadow = !isSoftwareGl;
    stadiumGroup.add(pitchMesh);

    // Part 2: Soft radial contact shadow base
    const shadowGeo = new THREE.PlaneGeometry(42, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.05;
    stadiumGroup.add(shadowMesh);

    // Part 3: Surrounding Pitch Turf Apron
    const apronGeo = new THREE.BoxGeometry(32, 0.2, 23);
    const apronMat = new THREE.MeshStandardMaterial({
      color: 0x14532d,
      roughness: 0.9,
      metalness: 0.05,
    });
    const apronMesh = new THREE.Mesh(apronGeo, apronMat);
    apronMesh.position.y = -0.11;
    apronMesh.receiveShadow = !isSoftwareGl;
    stadiumGroup.add(apronMesh);

    // Part 4: LED Advertising Hoarding Perimeter Rails
    const ledMat = new THREE.MeshBasicMaterial({ map: ledTexture });
    const sideRailGeo = new THREE.BoxGeometry(29, 0.8, 0.2);
    const endRailGeo = new THREE.BoxGeometry(0.2, 0.8, 20);

    const railNorth = new THREE.Mesh(sideRailGeo, ledMat);
    railNorth.position.set(0, 0.4, -10.2);
    stadiumGroup.add(railNorth);

    const railSouth = new THREE.Mesh(sideRailGeo, ledMat);
    railSouth.position.set(0, 0.4, 10.2);
    stadiumGroup.add(railSouth);

    const railWest = new THREE.Mesh(endRailGeo, ledMat);
    railWest.position.set(-14.5, 0.4, 0);
    stadiumGroup.add(railWest);

    const railEast = new THREE.Mesh(endRailGeo, ledMat);
    railEast.position.set(14.5, 0.4, 0);
    stadiumGroup.add(railEast);

    // Part 5: Grandstands (Tiered Seating Structures)
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.35,
    });
    const seatsMat = new THREE.MeshStandardMaterial({
      color: 0x0f766e,
      roughness: 0.4,
      metalness: 0.2,
    });

    // North Stand (Long side)
    const northStand = new THREE.Group();
    for (let tier = 0; tier < 4; tier++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(34, 1.2, 2.2), tier % 2 === 0 ? seatsMat : standMat);
      step.position.set(0, 0.6 + tier * 1.2, -12 - tier * 2);
      step.castShadow = !isSoftwareGl;
      step.receiveShadow = !isSoftwareGl;
      northStand.add(step);
    }
    stadiumGroup.add(northStand);

    // South Stand (Long side)
    const southStand = new THREE.Group();
    for (let tier = 0; tier < 4; tier++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(34, 1.2, 2.2), tier % 2 === 0 ? seatsMat : standMat);
      step.position.set(0, 0.6 + tier * 1.2, 12 + tier * 2);
      step.castShadow = !isSoftwareGl;
      step.receiveShadow = !isSoftwareGl;
      southStand.add(step);
    }
    stadiumGroup.add(southStand);

    // West & East Stands (Short ends)
    const westStand = new THREE.Group();
    for (let tier = 0; tier < 3; tier++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 20), standMat);
      step.position.set(-16 - tier * 2, 0.6 + tier * 1.2, 0);
      step.castShadow = !isSoftwareGl;
      step.receiveShadow = !isSoftwareGl;
      westStand.add(step);
    }
    stadiumGroup.add(westStand);

    const eastStand = new THREE.Group();
    for (let tier = 0; tier < 3; tier++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 20), standMat);
      step.position.set(16 + tier * 2, 0.6 + tier * 1.2, 0);
      step.castShadow = !isSoftwareGl;
      step.receiveShadow = !isSoftwareGl;
      eastStand.add(step);
    }
    stadiumGroup.add(eastStand);

    // Part 6: Architectural Canopy Roof Ribbons (North & South)
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.2,
      metalness: 0.8,
    });
    const roofNorth = new THREE.Mesh(new THREE.BoxGeometry(36, 0.4, 8), roofMat);
    roofNorth.position.set(0, 7.5, -14);
    roofNorth.rotation.x = 0.15;
    stadiumGroup.add(roofNorth);

    const roofSouth = new THREE.Mesh(new THREE.BoxGeometry(36, 0.4, 8), roofMat);
    roofSouth.position.set(0, 7.5, 14);
    roofSouth.rotation.x = -0.15;
    stadiumGroup.add(roofSouth);

    // Part 7: Goalposts (West & East)
    const postMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.7,
    });
    const createGoal = (xPos: number, isLeft: boolean) => {
      const goal = new THREE.Group();
      // Uprights
      const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), postMat);
      post1.position.set(0, 1.2, -1.8);
      goal.add(post1);

      const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), postMat);
      post2.position.set(0, 1.2, 1.8);
      goal.add(post2);

      // Crossbar
      const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 8), postMat);
      crossbar.rotation.x = Math.PI / 2;
      crossbar.position.set(0, 2.4, 0);
      goal.add(crossbar);

      // Net Frame Backing
      const netMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, wireframe: true, transparent: true, opacity: 0.4 });
      const net = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.3, 3.6), netMat);
      net.position.set(isLeft ? -0.6 : 0.6, 1.15, 0);
      goal.add(net);

      goal.position.set(xPos, 0, 0);
      return goal;
    };
    stadiumGroup.add(createGoal(-13.5, true));
    stadiumGroup.add(createGoal(13.5, false));

    // Part 8: Floodlight Pylons (4 Corners)
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.85,
    });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const createPylon = (x: number, z: number) => {
      const pylon = new THREE.Group();
      // Mast
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 16, 8), pylonMat);
      mast.position.y = 8;
      pylon.add(mast);

      // Light Panel Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2, 0.5), pylonMat);
      head.position.set(0, 15.5, 0);
      head.lookAt(0, 0, 0);
      pylon.add(head);

      // Emissive Bank
      const bank = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), bulbMat);
      bank.position.set(0, 15.5, 0.26);
      bank.lookAt(0, 0, 0);
      pylon.add(bank);

      // Local spotlight for night effect
      const spot = new THREE.SpotLight(0xfff7ed, 4, 45, Math.PI / 4, 0.4);
      spot.position.set(0, 15.5, 0);
      spot.target.position.set(0, 0, 0);
      scene.add(spot.target);
      pylon.add(spot);

      pylon.position.set(x, 0, z);
      return pylon;
    };

    stadiumGroup.add(createPylon(-18, -14));
    stadiumGroup.add(createPylon(18, -14));
    stadiumGroup.add(createPylon(-18, 14));
    stadiumGroup.add(createPylon(18, 14));

    // Part 9: Tactical Hologram Probability Nodes hovering over pitch
    const hologramNodes = new THREE.Group();
    scene.add(hologramNodes);

    // Ball on center spot with subtle bounce
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1,
    });
    const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), ballMat);
    ballMesh.position.set(0, 0.35, 0);
    ballMesh.castShadow = !isSoftwareGl;
    stadiumGroup.add(ballMesh);

    // 6. Store Scene References
    sceneRefs.current = {
      scene,
      camera,
      renderer,
      stadiumGroup,
      ledTexture,
      hologramNodes,
      dirLight,
      hemiLight,
    };

    // 7. Input Event Listeners for Smooth Orbit / Pan
    const onMouseDown = (e: MouseEvent) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.prevMouseX = e.clientX;
      controlsRef.current.prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!controlsRef.current.isDragging) return;
      const dx = e.clientX - controlsRef.current.prevMouseX;
      const dy = e.clientY - controlsRef.current.prevMouseY;

      controlsRef.current.rotY -= dx * 0.006;
      controlsRef.current.rotX = Math.max(0.1, Math.min(Math.PI / 2.1, controlsRef.current.rotX + dy * 0.006));

      controlsRef.current.prevMouseX = e.clientX;
      controlsRef.current.prevMouseY = e.clientY;
      setAutoRotate(false);
    };

    const onMouseUp = () => {
      controlsRef.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      controlsRef.current.zoom = Math.max(14, Math.min(55, controlsRef.current.zoom + e.deltaY * 0.03));
      setAutoRotate(false);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 8. Animation & Damping Render Loop (Lossless 60fps)
    const clock = new THREE.Clock();
    let tickerOffset = 0;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Animate LED Board Texture Ticker
      tickerOffset += dt * 80;
      if (ledTexture) {
        ledTexture.offset.x = (tickerOffset * 0.0008) % 1;
      }

      // Gentle Ball bounce
      ballMesh.position.y = 0.35 + Math.abs(Math.sin(elapsed * 2.5)) * 0.35;

      // Camera preset smooth exponential damping (1 - Math.exp(-k * dt))
      const ctrl = controlsRef.current;
      if (autoRotate && !ctrl.isDragging) {
        ctrl.rotY += dt * 0.25;
      }

      // Compute target camera pos from spherical coords
      const camX = ctrl.targetLookAt.x + Math.sin(ctrl.rotY) * Math.cos(ctrl.rotX) * ctrl.zoom;
      const camY = ctrl.targetLookAt.y + Math.sin(ctrl.rotX) * ctrl.zoom;
      const camZ = ctrl.targetLookAt.z + Math.cos(ctrl.rotY) * Math.cos(ctrl.rotX) * ctrl.zoom;

      _targetPos.set(camX, Math.max(2.5, camY), camZ);
      camera.position.lerp(_targetPos, 1 - Math.exp(-6 * dt));

      ctrl.currentLookAt.lerp(ctrl.targetLookAt, 1 - Math.exp(-6 * dt));
      camera.lookAt(ctrl.currentLookAt);

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight || 560;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);

      renderer.dispose();
      pitchTexture.dispose();
      ledTexture.dispose();
    };
  }, []);

  // Update Camera Presets
  useEffect(() => {
    const ctrl = controlsRef.current;
    if (cameraPreset === 'broadcast') {
      ctrl.rotX = 0.52;
      ctrl.rotY = 0.2;
      ctrl.zoom = 36;
      ctrl.targetLookAt.set(0, 0, 0);
    } else if (cameraPreset === 'tactical') {
      ctrl.rotX = Math.PI / 2.15; // overhead bird's eye
      ctrl.rotY = 0;
      ctrl.zoom = 28;
      ctrl.targetLookAt.set(0, 0, 0);
    } else if (cameraPreset === 'ground') {
      ctrl.rotX = 0.18;
      ctrl.rotY = -0.6;
      ctrl.zoom = 18;
      ctrl.targetLookAt.set(0, 1.2, 0);
    } else if (cameraPreset === 'corner') {
      ctrl.rotX = 0.35;
      ctrl.rotY = Math.PI / 4;
      ctrl.zoom = 22;
      ctrl.targetLookAt.set(-5, 0.5, -3);
    }
  }, [cameraPreset]);

  // Update Lighting Presets
  useEffect(() => {
    if (!sceneRefs.current) return;
    const { scene, dirLight, hemiLight } = sceneRefs.current;

    if (lightingPreset === 'night_floodlights') {
      scene.background = new THREE.Color(0x070b14);
      if (scene.fog) scene.fog.color = new THREE.Color(0x070b14);
      dirLight.color.setHex(0xfff7ed);
      dirLight.intensity = 2.2;
      hemiLight.color.setHex(0x818cf8);
      hemiLight.groundColor.setHex(0x0f172a);
      hemiLight.intensity = 0.6;
    } else if (lightingPreset === 'sunset') {
      scene.background = new THREE.Color(0x1e1b4b);
      if (scene.fog) scene.fog.color = new THREE.Color(0x1e1b4b);
      dirLight.color.setHex(0xf97316); // Golden orange
      dirLight.intensity = 2.8;
      hemiLight.color.setHex(0xfb7185);
      hemiLight.groundColor.setHex(0x312e81);
      hemiLight.intensity = 0.8;
    } else if (lightingPreset === 'hologram') {
      scene.background = new THREE.Color(0x020617);
      if (scene.fog) scene.fog.color = new THREE.Color(0x020617);
      dirLight.color.setHex(0x06b6d4); // Cyan tactical
      dirLight.intensity = 1.8;
      hemiLight.color.setHex(0x10b981);
      hemiLight.groundColor.setHex(0x020617);
      hemiLight.intensity = 0.9;
    }
  }, [lightingPreset]);

  return (
    <div className="space-y-4">
      {/* 3D Viewport Hero Frame (Zero-occlusion layout) */}
      <div className="relative w-full h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        {/* WebGL Canvas Isolated Mount */}
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Minimalist Top HUD Overlay (Claim & Match Info) */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-slate-950/80 border border-slate-800/80 px-3.5 py-2 rounded-xl text-xs backdrop-blur-none">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <div>
            <div className="font-bold text-white text-sm">
              {currentMatch.homeTeam} <span className="text-slate-500 font-normal">vs</span> {currentMatch.awayTeam}
            </div>
            <div className="text-[11px] text-slate-400">
              {currentMatch.competitionName} · {currentMatch.venue || 'Estadio Principal'}
            </div>
          </div>
        </div>

        {/* Top-Right Holographic Tactical Metrics Card */}
        {showHologramData && (
          <div className="absolute top-4 right-4 z-10 hidden sm:flex flex-col gap-1.5 bg-slate-950/90 border border-emerald-500/30 p-3 rounded-xl text-xs font-mono shadow-lg">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulación Táctica 3D</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>Prob. Local (1):</span>
              <strong className="text-white">{currentMatch.fairProbabilities.home}%</strong>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>Prob. Empate (X):</span>
              <strong className="text-white">{currentMatch.fairProbabilities.draw}%</strong>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>Prob. Visitante (2):</span>
              <strong className="text-white">{currentMatch.fairProbabilities.away}%</strong>
            </div>
            <div className="pt-1 border-t border-slate-800 flex items-center justify-between gap-4 text-[11px]">
              <span className="text-slate-400 font-sans">Mejor Pick EV+:</span>
              <span className="text-emerald-400 font-bold">
                {currentMatch.highestEVSelection} @{currentMatch.highestEVPrice?.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Unified Ergonomic Bottom Control Dock (Follows Section 5 Guidelines) */}
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ${
            isDockCollapsed ? 'translate-y-[calc(100%-12px)] opacity-90' : 'translate-y-0 opacity-100'
          }`}
          style={{ maxWidth: 'min(920px, 94vw)' }}
        >
          {/* Collapse / Expand Tab Button */}
          <div className="flex justify-center -mb-px">
            <button
              onClick={() => setIsDockCollapsed(!isDockCollapsed)}
              className="flex items-center gap-1 px-3 py-1 bg-slate-900 border border-slate-700/80 rounded-t-lg text-[11px] font-medium text-slate-300 hover:text-white transition-colors shadow-md"
            >
              {isDockCollapsed ? (
                <>
                  <ChevronUp className="w-3 h-3 text-emerald-400" />
                  <span>Mostrar Controles 3D</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                  <span>Ocultar Controles</span>
                </>
              )}
            </button>
          </div>

          {/* Dock Controls Body */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Camera View Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cámara:</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setCameraPreset('broadcast')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    cameraPreset === 'broadcast'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Transmisión
                </button>
                <button
                  onClick={() => setCameraPreset('tactical')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    cameraPreset === 'tactical'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cenital Táctica
                </button>
                <button
                  onClick={() => setCameraPreset('ground')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    cameraPreset === 'ground'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Banquillo
                </button>
                <button
                  onClick={() => setCameraPreset('corner')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    cameraPreset === 'corner'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Córner
                </button>
              </div>
            </div>

            {/* Lighting Mode Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium text-[11px]">Iluminación:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setLightingPreset('night_floodlights')}
                  title="Focos Nocturnos"
                  className={`p-1.5 rounded transition-colors ${
                    lightingPreset === 'night_floodlights' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setLightingPreset('sunset')}
                  title="Tarde Dorada"
                  className={`p-1.5 rounded transition-colors ${
                    lightingPreset === 'sunset' ? 'bg-slate-800 text-orange-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setLightingPreset('hologram')}
                  title="Modo Holográfico Táctico"
                  className={`p-1.5 rounded transition-colors ${
                    lightingPreset === 'hologram' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Rotation Toggle & Hologram Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                  autoRotate
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{autoRotate ? 'Giro Activo' : 'Giro Pausado'}</span>
              </button>

              <button
                onClick={() => setShowHologramData(!showHologramData)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                  showHologramData
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Datos Tácticos</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Match Selector Bar for 3D Stadium */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">Cambiar Partido en Estadio 3D:</span>
          <select
            value={activeMatchId}
            onChange={(e) => setActiveMatchId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.homeTeam} vs {m.awayTeam} ({m.competitionName})
              </option>
            ))}
          </select>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Arrastra con el ratón para rotar la cámara 360° · Rueda para zoom
        </div>
      </div>
    </div>
  );
};
