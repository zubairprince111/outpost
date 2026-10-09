import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SubsystemType, SubsystemState, ResourceState } from '../simulation/SimulationModels';

export interface SceneCallbacks {
  onSubsystemClick: (type: SubsystemType) => void;
  onCameraTransitionEnd?: () => void;
  onOrbitReady?: () => void;
}

export type VisualMode = 'nominal' | 'crisis' | 'preview_keep_running' | 'preview_conserve' | 'preview_emergency';

export class LunarSceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private gltfLoader: GLTFLoader;
  private callbacks: SceneCallbacks;

  // Scene Objects
  private earthGroup: THREE.Group = new THREE.Group();
  private outpostGroup: THREE.Group = new THREE.Group();
  private terrainGroup: THREE.Group = new THREE.Group();
  private conduitPipes: THREE.Line[] = [];
  private conduitPulses: THREE.Mesh[] = [];

  // Subsystem 3D Nodes
  private subsystemNodes: Map<SubsystemType, THREE.Object3D> = new Map();
  private solarArrayMesh: THREE.Object3D | null = null;
  private habitatMesh: THREE.Object3D | null = null;
  private greenhouseMesh: THREE.Object3D | null = null;
  private scienceLabMesh: THREE.Object3D | null = null;
  private batteryMesh: THREE.Object3D | null = null;
  private commDishMesh: THREE.Object3D | null = null;
  private roverMesh: THREE.Object3D | null = null;
  private scienceLaserBeam: THREE.Mesh | null = null;

  // Lights
  private sunLight: THREE.DirectionalLight;
  private earthBounceLight: THREE.DirectionalLight;
  private habitatInteriorLight: THREE.PointLight;
  private greenhouseGlowLight: THREE.PointLight;
  private crisisAlarmLight: THREE.PointLight;

  // ORBIT Character
  private orbitBotGroup: THREE.Group = new THREE.Group();
  private orbitEyeMesh: THREE.Mesh | null = null;
  private orbitThrusterGlow: THREE.Mesh | null = null;
  private orbitTargetPosition: THREE.Vector3 = new THREE.Vector3(0, 3.5, 6);
  private orbitState: 'normal' | 'alarmed' | 'thinking' | 'celebrating' = 'normal';

  // Selection
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private selectedSubsystem: SubsystemType | null = null;
  private highlightRing: THREE.Mesh | null = null;

  // Camera Animation State
  private isCameraTransitioning: boolean = false;
  private cameraStartPos: THREE.Vector3 = new THREE.Vector3();
  private cameraTargetPos: THREE.Vector3 = new THREE.Vector3();
  private cameraStartLookAt: THREE.Vector3 = new THREE.Vector3();
  private cameraTargetLookAt: THREE.Vector3 = new THREE.Vector3();
  private currentLookAt: THREE.Vector3 = new THREE.Vector3(0, 1.5, 0);
  private cameraTransitionProgress: number = 1.0;
  private cameraTransitionDuration: number = 2.0;

  // Arrival Cinematic State
  private isArrivalCinematic: boolean = false;
  private arrivalStartTime: number = 0;

  // Animation Loop
  private animationFrameId: number | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private currentVisualMode: VisualMode = 'nominal';

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02040a); // Deep lunar black sky
    this.scene.fog = new THREE.FogExp2(0x050914, 0.0035);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 18, 42);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't clip below ground
    this.controls.minDistance = 6;
    this.controls.maxDistance = 140;
    this.controls.target.copy(this.currentLookAt);

    // 5. Loader
    this.gltfLoader = new GLTFLoader();

    // 6. Lighting setup
    const ambientLight = new THREE.AmbientLight(0x0c1428, 0.4);
    this.scene.add(ambientLight);

    // Harsh lunar directional sunlight
    this.sunLight = new THREE.DirectionalLight(0xfff5e6, 3.2);
    this.sunLight.position.set(-65, 45, 30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 180;
    this.sunLight.shadow.camera.left = -50;
    this.sunLight.shadow.camera.right = 50;
    this.sunLight.shadow.camera.top = 50;
    this.sunLight.shadow.camera.bottom = -50;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Subtle blue Earthshine
    this.earthBounceLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    this.earthBounceLight.position.set(40, 60, -50);
    this.scene.add(this.earthBounceLight);

    // Habitat interior glow
    this.habitatInteriorLight = new THREE.PointLight(0xffd59e, 2.8, 25);
    this.habitatInteriorLight.position.set(0, 3, 0);
    this.scene.add(this.habitatInteriorLight);

    // Greenhouse green bioluminescence
    this.greenhouseGlowLight = new THREE.PointLight(0x10b981, 2.5, 20);
    this.greenhouseGlowLight.position.set(8, 2.5, -4);
    this.scene.add(this.greenhouseGlowLight);

    // Emergency red siren light
    this.crisisAlarmLight = new THREE.PointLight(0xef4444, 0, 35);
    this.crisisAlarmLight.position.set(0, 6, 0);
    this.scene.add(this.crisisAlarmLight);

    // 7. Build Environment & Celestial objects
    this.initSkyStars();
    this.initEarth();
    this.initLunarTerrain();
    this.initConduits();
    this.initHighlightRing();
    this.initOrbitCompanion();

    // 8. Load 3D Models
    this.loadOutpostModels();

    // Event listeners
    window.addEventListener('resize', this.onWindowResize);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);

    // Start render loop
    this.clock.start();
    this.animate();
  }

  /* =========================================================================
   * SKY, STARS & CELESTIAL EARTH
   * ========================================================================= */
  private initSkyStars() {
    const starCount = 2800;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const color1 = new THREE.Color(0xffffff);
    const color2 = new THREE.Color(0x93c5fd); // Light blue
    const color3 = new THREE.Color(0xfde68a); // Faint gold

    for (let i = 0; i < starCount; i++) {
      const radius = 600 + Math.random() * 400;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(radius * Math.sin(phi) * Math.sin(theta)) + 15; // Keep mostly above lunar horizon
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const pickedColor = Math.random() < 0.65 ? color1 : (Math.random() < 0.5 ? color2 : color3);
      starColors[i * 3] = pickedColor.r;
      starColors[i * 3 + 1] = pickedColor.g;
      starColors[i * 3 + 2] = pickedColor.b;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(starField);
  }

  private initEarth() {
    // Earth positioned in the deep space skybox
    this.earthGroup.position.set(180, 140, -220);

    const textureLoader = new THREE.TextureLoader();
    const earthMap = textureLoader.load('/textures/earth_atmos_2048.jpg');
    const cloudsMap = textureLoader.load('/textures/earth_clouds_1024.png');

    // Earth Sphere
    const earthGeometry = new THREE.SphereGeometry(28, 48, 48);
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthMap,
      roughness: 0.8,
      metalness: 0.1
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    this.earthGroup.add(earthMesh);

    // Clouds Sphere
    const cloudsGeometry = new THREE.SphereGeometry(28.35, 48, 48);
    const cloudsMaterial = new THREE.MeshStandardMaterial({
      map: cloudsMap,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    cloudsMesh.name = 'earthClouds';
    this.earthGroup.add(cloudsMesh);

    // Atmospheric rim glow
    const atmosGeometry = new THREE.SphereGeometry(30.2, 32, 32);
    const atmosMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const atmosMesh = new THREE.Mesh(atmosGeometry, atmosMaterial);
    this.earthGroup.add(atmosMesh);

    this.scene.add(this.earthGroup);
  }

  /* =========================================================================
   * DETAILED LUNAR TERRAIN WITH ELEVATIONS & CRATERS
   * ========================================================================= */
  private initLunarTerrain() {
    // Terrain mesh with procedural crater craters and rim mountains
    const size = 320;
    const segments = 128;
    const terrainGeo = new THREE.PlaneGeometry(size, size, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const v = new THREE.Vector3();

    // Crater centers [x, z, radius, depth]
    const craters = [
      [ -28,  20, 16, 3.8 ],
      [  32, -18, 22, 5.2 ],
      [ -45, -35, 30, 7.5 ],
      [  15,  35, 12, 2.5 ],
      [ -14,  -2,  9, 1.8 ]
    ];

    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i);

      // Subtle base undulation
      let height = Math.sin(v.x * 0.035) * Math.cos(v.z * 0.035) * 1.2
                 + Math.sin(v.x * 0.09 + v.z * 0.06) * 0.5;

      // Distant mountain ridges
      const distFromCenter = Math.sqrt(v.x * v.x + v.z * v.z);
      if (distFromCenter > 70) {
        const factor = (distFromCenter - 70) / 90;
        height += (Math.sin(v.x * 0.04) * 8 + Math.cos(v.z * 0.04) * 6 + 12) * Math.min(factor, 1.8);
      }

      // Lunar mountain ridge that casts the crisis shadow!
      if (v.x < -30 && v.z > 0 && v.z < 60) {
        height += Math.max(0, 14 - Math.abs(v.x + 50) * 0.4);
      }

      // Carve craters
      for (const [cx, cz, cr, cd] of craters) {
        const dist = Math.hypot(v.x - cx, v.z - cz);
        if (dist < cr) {
          const normDist = dist / cr;
          // Crater bowl
          const bowl = Math.cos(normDist * Math.PI * 0.5);
          height -= bowl * cd;
          // Crater elevated rim
          if (normDist > 0.75) {
            height += Math.sin((normDist - 0.75) * 4 * Math.PI) * (cd * 0.35);
          }
        }
      }

      // Smooth central outpost basin around (0,0)
      if (distFromCenter < 24) {
        height *= distFromCenter / 24;
      }

      posAttr.setY(i, height);
    }

    terrainGeo.computeVertexNormals();

    const textureLoader = new THREE.TextureLoader();
    const moonTexture = textureLoader.load('/textures/moon_1024.jpg');
    moonTexture.wrapS = THREE.RepeatWrapping;
    moonTexture.wrapT = THREE.RepeatWrapping;
    moonTexture.repeat.set(16, 16);

    const terrainMat = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 0.94,
      metalness: 0.08,
      color: 0x888b94
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    this.terrainGroup.add(terrainMesh);

    // Scattered regolith rocks and boulders
    const rockGeo = new THREE.DodecahedronGeometry(0.8, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x6e727c,
      roughness: 0.95
    });

    for (let i = 0; i < 90; i++) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const angle = Math.random() * Math.PI * 2;
      const radius = 12 + Math.random() * 65;
      const scale = 0.4 + Math.random() * 1.4;
      rock.position.set(Math.cos(angle) * radius, scale * 0.5, Math.sin(angle) * radius);
      rock.scale.set(scale, scale * (0.6 + Math.random() * 0.8), scale);
      rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.terrainGroup.add(rock);
    }

    this.scene.add(this.terrainGroup);
  }

  /* =========================================================================
   * GLB OUTPOST MODELS LOADING & PLACEMENT
   * ========================================================================= */
  private loadOutpostModels() {
    this.scene.add(this.outpostGroup);

    // 1. SOLAR ARRAYS (Jummit solar panel GLB)
    this.gltfLoader.load(
      '/models/solar_panels.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(2.4, 2.4, 2.4);
        model.position.set(-14, 0, 8);
        model.rotation.y = -Math.PI * 0.35;
        this.enableShadows(model);
        model.userData = { subsystemType: SubsystemType.SOLAR_ARRAY };

        this.solarArrayMesh = model;
        this.subsystemNodes.set(SubsystemType.SOLAR_ARRAY, model);
        this.outpostGroup.add(model);
      },
      undefined,
      () => {
        // Procedural Fallback if file takes longer
        this.createFallbackSolarArray();
      }
    );

    // 2. CREW HABITAT DOME (hangar_largeA.glb)
    this.gltfLoader.load(
      '/models/hangar_largeA.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(3.2, 3.2, 3.2);
        model.position.set(0, 0, 0);
        this.enableShadows(model);
        model.userData = { subsystemType: SubsystemType.HABITAT };

        this.habitatMesh = model;
        this.subsystemNodes.set(SubsystemType.HABITAT, model);
        this.outpostGroup.add(model);
      },
      undefined,
      () => {
        this.createFallbackHabitat();
      }
    );

    // 3. GREENHOUSE BIODOME (hangar_roundGlass.glb)
    this.gltfLoader.load(
      '/models/hangar_roundGlass.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(2.6, 2.6, 2.6);
        model.position.set(8, 0, -4);
        this.enableShadows(model);

        // Enhance glass material
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
              if (mesh.name.toLowerCase().includes('glass') || mat.name.toLowerCase().includes('glass')) {
                mat.transparent = true;
                mat.opacity = 0.55;
                mat.roughness = 0.1;
                mat.metalness = 0.1;
                mat.color = new THREE.Color(0x34d399);
              }
              mesh.material = mat;
            }
          }
        });

        model.userData = { subsystemType: SubsystemType.GREENHOUSE };
        this.greenhouseMesh = model;
        this.subsystemNodes.set(SubsystemType.GREENHOUSE, model);
        this.outpostGroup.add(model);
      },
      undefined,
      () => {
        this.createFallbackGreenhouse();
      }
    );

    // 4. BATTERY STORAGE BANK (machine_generatorLarge.glb)
    this.gltfLoader.load(
      '/models/machine_generatorLarge.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(2.8, 2.8, 2.8);
        model.position.set(-6, 0, 5);
        this.enableShadows(model);
        model.userData = { subsystemType: SubsystemType.BATTERY_STORAGE };

        this.batteryMesh = model;
        this.subsystemNodes.set(SubsystemType.BATTERY_STORAGE, model);
        this.outpostGroup.add(model);
      },
      undefined,
      () => {
        this.createFallbackBattery();
      }
    );

    // 5. SCIENCE LAB (corridor_window.glb)
    this.gltfLoader.load(
      '/models/corridor_window.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(3.0, 3.0, 3.0);
        model.position.set(6, 0, 6);
        model.rotation.y = Math.PI * 0.25;
        this.enableShadows(model);
        model.userData = { subsystemType: SubsystemType.SCIENCE_LAB };

        this.scienceLabMesh = model;
        this.subsystemNodes.set(SubsystemType.SCIENCE_LAB, model);
        this.outpostGroup.add(model);
        this.initScienceLaser();
      },
      undefined,
      () => {
        this.createFallbackScienceLab();
      }
    );

    // 6. DEEP SPACE COMM ANTENNA (satelliteDish_detailed.glb)
    this.gltfLoader.load(
      '/models/satelliteDish_detailed.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(3.0, 3.0, 3.0);
        model.position.set(-4, 0, -8);
        model.lookAt(180, 140, -220); // Aim directly at Earth!
        this.enableShadows(model);
        model.userData = { subsystemType: SubsystemType.COMM_ARRAY };

        this.commDishMesh = model;
        this.subsystemNodes.set(SubsystemType.COMM_ARRAY, model);
        this.outpostGroup.add(model);
      },
      undefined,
      () => {
        this.createFallbackCommDish();
      }
    );

    // 7. LUNAR EXPLORATION ROVER (rover.glb)
    this.gltfLoader.load(
      '/models/rover.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(2.2, 2.2, 2.2);
        model.position.set(13, 0.2, 9);
        model.rotation.y = -Math.PI * 0.4;
        this.enableShadows(model);
        model.userData = { subsystemType: SubsystemType.ROVER };

        this.roverMesh = model;
        this.subsystemNodes.set(SubsystemType.ROVER, model);
        this.outpostGroup.add(model);
      },
      undefined,
      () => {
        this.createFallbackRover();
      }
    );

    // 8. ASTRONAUTS ON EVA (astronautA.glb & astronautB.glb)
    this.gltfLoader.load('/models/astronautA.glb', (gltf) => {
      const astronaut = gltf.scene;
      astronaut.scale.set(1.4, 1.4, 1.4);
      astronaut.position.set(2.5, 0, 4.5);
      astronaut.rotation.y = Math.PI * 0.2;
      this.enableShadows(astronaut);
      this.outpostGroup.add(astronaut);
    });

    this.gltfLoader.load('/models/astronautB.glb', (gltf) => {
      const astronaut = gltf.scene;
      astronaut.scale.set(1.4, 1.4, 1.4);
      astronaut.position.set(-8, 0, 6.2);
      astronaut.rotation.y = -Math.PI * 0.5;
      this.enableShadows(astronaut);
      this.outpostGroup.add(astronaut);
    });

    // 9. FOUNDATION PLATFORMS & CRATERS
    this.gltfLoader.load('/models/craterLarge.glb', (gltf) => {
      const crater = gltf.scene;
      crater.scale.set(4, 3, 4);
      crater.position.set(-28, -0.4, 20);
      this.enableShadows(crater);
      this.outpostGroup.add(crater);
    });

    this.gltfLoader.load('/models/platform_large.glb', (gltf) => {
      const platform = gltf.scene;
      platform.scale.set(3, 1, 3);
      platform.position.set(0, -0.1, 0);
      this.enableShadows(platform);
      this.outpostGroup.add(platform);
    });
  }

  private enableShadows(obj: THREE.Object3D) {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  /* =========================================================================
   * PROCEDURAL FALLBACKS (Zero visual disruption if models load async)
   * ========================================================================= */
  private createFallbackSolarArray() {
    if (this.solarArrayMesh) return;
    const group = new THREE.Group();
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2, metalness: 0.8 });
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 4, 16), mastMat);
    mast.position.y = 2;
    group.add(mast);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 2.5), panelMat);
    wing.position.set(0, 3.8, 0);
    wing.rotation.x = 0.3;
    group.add(wing);

    group.position.set(-14, 0, 8);
    group.userData = { subsystemType: SubsystemType.SOLAR_ARRAY };
    this.solarArrayMesh = group;
    this.subsystemNodes.set(SubsystemType.SOLAR_ARRAY, group);
    this.outpostGroup.add(group);
  }

  private createFallbackHabitat() {
    if (this.habitatMesh) return;
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.2 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(4.5, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), domeMat);
    dome.position.set(0, 0, 0);
    dome.userData = { subsystemType: SubsystemType.HABITAT };
    this.habitatMesh = dome;
    this.subsystemNodes.set(SubsystemType.HABITAT, dome);
    this.outpostGroup.add(dome);
  }

  private createFallbackGreenhouse() {
    if (this.greenhouseMesh) return;
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x34d399, transparent: true, opacity: 0.6, roughness: 0.1 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.5, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), glassMat);
    dome.position.set(8, 0, -4);
    dome.userData = { subsystemType: SubsystemType.GREENHOUSE };
    this.greenhouseMesh = dome;
    this.subsystemNodes.set(SubsystemType.GREENHOUSE, dome);
    this.outpostGroup.add(dome);
  }

  private createFallbackBattery() {
    if (this.batteryMesh) return;
    const batMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 2), batMat);
    box.position.set(-6, 1.25, 5);
    box.userData = { subsystemType: SubsystemType.BATTERY_STORAGE };
    this.batteryMesh = box;
    this.subsystemNodes.set(SubsystemType.BATTERY_STORAGE, box);
    this.outpostGroup.add(box);
  }

  private createFallbackScienceLab() {
    if (this.scienceLabMesh) return;
    const labMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.3 });
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3, 16), labMat);
    cyl.position.set(6, 1.5, 6);
    cyl.userData = { subsystemType: SubsystemType.SCIENCE_LAB };
    this.scienceLabMesh = cyl;
    this.subsystemNodes.set(SubsystemType.SCIENCE_LAB, cyl);
    this.outpostGroup.add(cyl);
    this.initScienceLaser();
  }

  private createFallbackCommDish() {
    if (this.commDishMesh) return;
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const dish = new THREE.Mesh(new THREE.SphereGeometry(2, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.3), dishMat);
    dish.position.set(-4, 3, -8);
    dish.lookAt(180, 140, -220);
    dish.userData = { subsystemType: SubsystemType.COMM_ARRAY };
    this.commDishMesh = dish;
    this.subsystemNodes.set(SubsystemType.COMM_ARRAY, dish);
    this.outpostGroup.add(dish);
  }

  private createFallbackRover() {
    if (this.roverMesh) return;
    const roverMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 3), roverMat);
    body.position.set(12, 0.5, 8);
    body.userData = { subsystemType: SubsystemType.ROVER };
    this.roverMesh = body;
    this.subsystemNodes.set(SubsystemType.ROVER, body);
    this.outpostGroup.add(body);
  }

  /* =========================================================================
   * ANIMATED RESOURCE CONDUITS (SOLAR -> BATTERY -> BASE)
   * ========================================================================= */
  private initConduits() {
    const paths: THREE.Vector3[][] = [
      // Solar to Battery
      [ new THREE.Vector3(-14, 0.3, 8), new THREE.Vector3(-10, 0.3, 7), new THREE.Vector3(-6, 0.3, 5) ],
      // Battery to Habitat
      [ new THREE.Vector3(-6, 0.3, 5), new THREE.Vector3(-3, 0.3, 2.5), new THREE.Vector3(0, 0.3, 0) ],
      // Habitat to Greenhouse
      [ new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(4, 0.3, -2), new THREE.Vector3(8, 0.3, -4) ],
      // Habitat to Science Lab
      [ new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(3, 0.3, 3), new THREE.Vector3(6, 0.3, 6) ]
    ];

    const pulseGeo = new THREE.SphereGeometry(0.24, 12, 12);

    paths.forEach((points) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const curvePoints = curve.getPoints(30);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x06b6d4,
        linewidth: 2,
        transparent: true,
        opacity: 0.6
      });
      const pipe = new THREE.Line(lineGeo, lineMat);
      this.conduitPipes.push(pipe);
      this.scene.add(pipe);

      // Energy pulse
      const pulseMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      pulse.userData = { curve, t: Math.random() };
      this.conduitPulses.push(pulse);
      this.scene.add(pulse);
    });
  }

  private initScienceLaser() {
    if (this.scienceLaserBeam) return;
    const laserGeo = new THREE.CylinderGeometry(0.08, 0.08, 12, 8);
    laserGeo.rotateX(Math.PI / 2);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7, // Deep violet science laser
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.scienceLaserBeam = new THREE.Mesh(laserGeo, laserMat);
    this.scienceLaserBeam.position.set(6, 1.8, 12);
    this.scienceLaserBeam.lookAt(12, 0.3, 18);
    this.scienceLaserBeam.visible = false;
    this.scene.add(this.scienceLaserBeam);
  }

  /* =========================================================================
   * ORBIT COMPANION CHARACTER (In-World Mission Robot)
   * ========================================================================= */
  private initOrbitCompanion() {
    // Spherical floating chassis
    const bodyGeo = new THREE.SphereGeometry(0.7, 32, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.7,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.orbitBotGroup.add(body);

    // Expressive Visor / Eye
    const eyeGeo = new THREE.SphereGeometry(0.35, 24, 24);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 }); // Cyan eye
    this.orbitEyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    this.orbitEyeMesh.position.set(0, 0.1, 0.52);
    this.orbitEyeMesh.scale.set(1.2, 0.7, 0.5);
    this.orbitBotGroup.add(this.orbitEyeMesh);

    // Dual Thruster Ring
    const thrusterGeo = new THREE.TorusGeometry(0.45, 0.08, 12, 24);
    thrusterGeo.rotateX(Math.PI / 2);
    const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const thrusterRing = new THREE.Mesh(thrusterGeo, thrusterMat);
    thrusterRing.position.set(0, -0.65, 0);
    this.orbitBotGroup.add(thrusterRing);

    // Thruster plasma glow
    const glowGeo = new THREE.ConeGeometry(0.35, 1.0, 16);
    glowGeo.rotateX(Math.PI);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.orbitThrusterGlow = new THREE.Mesh(glowGeo, glowMat);
    this.orbitThrusterGlow.position.set(0, -1.15, 0);
    this.orbitBotGroup.add(this.orbitThrusterGlow);

    // Antenna
    const antGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
    const antMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const antenna = new THREE.Mesh(antGeo, antMat);
    antenna.position.set(0, 0.9, 0);
    this.orbitBotGroup.add(antenna);

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    tip.position.set(0, 1.2, 0);
    this.orbitBotGroup.add(tip);

    this.orbitBotGroup.position.copy(this.orbitTargetPosition);
    this.orbitBotGroup.castShadow = true;
    this.scene.add(this.orbitBotGroup);

    this.callbacks.onOrbitReady?.();
  }

  public setOrbitState(state: 'normal' | 'alarmed' | 'thinking' | 'celebrating') {
    this.orbitState = state;
    if (!this.orbitEyeMesh) return;

    const eyeMat = this.orbitEyeMesh.material as THREE.MeshBasicMaterial;
    if (state === 'alarmed') {
      eyeMat.color.setHex(0xef4444); // Red
    } else if (state === 'thinking') {
      eyeMat.color.setHex(0xf59e0b); // Amber
    } else if (state === 'celebrating') {
      eyeMat.color.setHex(0x10b981); // Emerald
    } else {
      eyeMat.color.setHex(0x06b6d4); // Cyan
    }
  }

  public moveOrbitTo(targetPos: THREE.Vector3) {
    this.orbitTargetPosition.copy(targetPos);
  }

  /* =========================================================================
   * SELECTION & IN-WORLD HIGHLIGHT RING
   * ========================================================================= */
  private initHighlightRing() {
    const ringGeo = new THREE.RingGeometry(3.5, 4.0, 36);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    this.highlightRing = new THREE.Mesh(ringGeo, ringMat);
    this.highlightRing.position.set(0, 0.08, 0);
    this.highlightRing.visible = false;
    this.scene.add(this.highlightRing);
  }

  private onPointerDown = (event: PointerEvent) => {
    if (this.isCameraTransitioning || this.isArrivalCinematic) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.outpostGroup.children, true);

    if (intersects.length > 0) {
      let current: THREE.Object3D | null = intersects[0].object;
      while (current && current !== this.outpostGroup) {
        if (current.userData && current.userData.subsystemType) {
          const type = current.userData.subsystemType as SubsystemType;
          this.selectSubsystem(type);
          this.callbacks.onSubsystemClick(type);
          return;
        }
        current = current.parent;
      }
    }
  };

  public selectSubsystem(type: SubsystemType | null) {
    this.selectedSubsystem = type;
    if (!type) {
      if (this.highlightRing) this.highlightRing.visible = false;
      return;
    }

    const node = this.subsystemNodes.get(type);
    if (node) {
      if (this.highlightRing) {
        this.highlightRing.position.set(node.position.x, 0.08, node.position.z);
        this.highlightRing.visible = true;
      }

      // Smooth camera transition to focus on the subsystem
      const cameraOffset = new THREE.Vector3(node.position.x + 8, 7, node.position.z + 12);
      this.animateCameraTo(cameraOffset, node.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 1.4);

      // Move ORBIT companion to inspect the chosen subsystem!
      const orbitPos = node.position.clone().add(new THREE.Vector3(-2.5, 3.5, 2.5));
      this.moveOrbitTo(orbitPos);
    }
  }

  /* =========================================================================
   * CINEMATIC CAMERA TRANSITIONS & ARRIVAL FLYBY
   * ========================================================================= */
  public startArrivalCinematic() {
    this.isArrivalCinematic = true;
    this.arrivalStartTime = this.clock.getElapsedTime();
    this.controls.enabled = false;

    // Start high above moon looking at Earth
    this.camera.position.set(-60, 48, 85);
    this.camera.lookAt(180, 140, -220);
    this.currentLookAt.set(0, 2, 0);

    // Habitat starts off, lights up on arrival
    this.habitatInteriorLight.intensity = 0.2;
  }

  public animateCameraTo(targetPos: THREE.Vector3, lookAtPos: THREE.Vector3, duration = 1.8) {
    this.isCameraTransitioning = true;
    this.controls.enabled = false;
    this.cameraStartPos.copy(this.camera.position);
    this.cameraTargetPos.copy(targetPos);
    this.cameraStartLookAt.copy(this.currentLookAt);
    this.cameraTargetLookAt.copy(lookAtPos);
    this.cameraTransitionDuration = duration;
    this.cameraTransitionProgress = 0.0;
  }

  public resetToOverview() {
    this.selectSubsystem(null);
    this.animateCameraTo(new THREE.Vector3(0, 18, 42), new THREE.Vector3(0, 1.5, 0), 1.6);
    this.moveOrbitTo(new THREE.Vector3(0, 3.5, 6));
  }

  /* =========================================================================
   * VISUAL ENVIRONMENT RESPONSIVENESS (Crisis & Future Fork Previews)
   * ========================================================================= */
  public setVisualMode(mode: VisualMode) {
    this.currentVisualMode = mode;

    switch (mode) {
      case 'crisis':
        // Sun shifts to cast harsh long shadow across solar panel
        this.sunLight.position.set(-80, 15, 20);
        this.sunLight.intensity = 1.6;
        this.crisisAlarmLight.intensity = 3.5;
        this.habitatInteriorLight.color.setHex(0xf97316); // Amber emergency
        this.habitatInteriorLight.intensity = 1.0;
        this.setOrbitState('alarmed');
        if (this.solarArrayMesh) {
          const orbitNearSolar = this.solarArrayMesh.position.clone().add(new THREE.Vector3(2, 4, 3));
          this.moveOrbitTo(orbitNearSolar);
        }
        break;

      case 'preview_keep_running':
        // Full science laser blast, but habitat power struggling
        this.sunLight.position.set(-80, 15, 20);
        this.crisisAlarmLight.intensity = 2.0;
        this.habitatInteriorLight.intensity = 0.8;
        if (this.scienceLaserBeam) this.scienceLaserBeam.visible = true;
        this.setOrbitState('thinking');
        break;

      case 'preview_conserve':
        // Safe, balanced lighting, science paused
        this.sunLight.position.set(-65, 45, 30);
        this.sunLight.intensity = 3.0;
        this.crisisAlarmLight.intensity = 0;
        this.habitatInteriorLight.color.setHex(0xffd59e);
        this.habitatInteriorLight.intensity = 2.5;
        if (this.scienceLaserBeam) this.scienceLaserBeam.visible = false;
        this.setOrbitState('normal');
        break;

      case 'preview_emergency':
        // Extreme power savings: habitat dimmed to red beacons, high battery preservation
        this.sunLight.position.set(-80, 15, 20);
        this.crisisAlarmLight.intensity = 1.2;
        this.habitatInteriorLight.color.setHex(0xef4444);
        this.habitatInteriorLight.intensity = 0.6;
        this.greenhouseGlowLight.intensity = 0.8;
        if (this.scienceLaserBeam) this.scienceLaserBeam.visible = false;
        this.setOrbitState('thinking');
        break;

      case 'nominal':
      default:
        this.sunLight.position.set(-65, 45, 30);
        this.sunLight.intensity = 3.2;
        this.crisisAlarmLight.intensity = 0;
        this.habitatInteriorLight.color.setHex(0xffd59e);
        this.habitatInteriorLight.intensity = 2.8;
        this.greenhouseGlowLight.intensity = 2.5;
        if (this.scienceLaserBeam) this.scienceLaserBeam.visible = false;
        this.setOrbitState('normal');
        break;
    }
  }

  public applyConsequenceState(state: ResourceState, effect: 'science_laser' | 'balanced_conserve' | 'emergency_dim') {
    if (effect === 'science_laser') {
      this.setVisualMode('preview_keep_running');
      this.setOrbitState('alarmed'); // Worried about battery drain!
    } else if (effect === 'emergency_dim') {
      this.setVisualMode('preview_emergency');
      this.setOrbitState('thinking');
    } else {
      this.setVisualMode('preview_conserve');
      this.setOrbitState('celebrating');
    }

    // Dynamic battery indicator updates
    const batteryRatio = state.battery / 100;
    if (batteryRatio < 0.25) {
      this.crisisAlarmLight.intensity = 4.0;
    }
  }

  /* =========================================================================
   * MAIN ANIMATION LOOP
   * ========================================================================= */
  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Earth rotation & clouds drift
    this.earthGroup.rotation.y = elapsedTime * 0.02;
    const clouds = this.earthGroup.getObjectByName('earthClouds');
    if (clouds) {
      clouds.rotation.y = elapsedTime * 0.035;
    }

    // 2. Animated Conduits Energy Flow
    this.conduitPulses.forEach((pulse) => {
      pulse.userData.t = (pulse.userData.t + delta * 0.45) % 1.0;
      const point = pulse.userData.curve.getPoint(pulse.userData.t);
      pulse.position.copy(point);
    });

    // 3. Subsystem Idle Behaviors
    if (this.commDishMesh) {
      this.commDishMesh.rotation.y = Math.sin(elapsedTime * 0.5) * 0.12;
    }
    if (this.highlightRing && this.highlightRing.visible) {
      this.highlightRing.rotation.z += delta * 1.2;
    }

    // 4. ORBIT Companion Floating & Gestures
    const bobOffset = Math.sin(elapsedTime * 3.0) * 0.22;
    const currentOrbitTarget = this.orbitTargetPosition.clone();
    currentOrbitTarget.y += bobOffset;

    this.orbitBotGroup.position.lerp(currentOrbitTarget, delta * 2.8);
    // ORBIT looks toward the camera
    this.orbitBotGroup.lookAt(this.camera.position.x, this.orbitBotGroup.position.y, this.camera.position.z);

    if (this.orbitState === 'alarmed') {
      this.orbitBotGroup.rotation.z += Math.sin(elapsedTime * 15) * 0.08;
    } else if (this.orbitState === 'celebrating') {
      this.orbitBotGroup.rotation.y += delta * 6.0;
    }

    // 5. Cinematic Arrival Sequence
    if (this.isArrivalCinematic) {
      const cinematicT = (elapsedTime - this.arrivalStartTime) / 4.8;
      if (cinematicT < 1.0) {
        // Curve sweep from high orbit down to landing outpost
        const ease = this.easeInOutQuad(cinematicT);
        const startPos = new THREE.Vector3(-60, 48, 85);
        const endPos = new THREE.Vector3(0, 18, 42);

        this.camera.position.lerpVectors(startPos, endPos, ease);
        this.camera.position.y += Math.sin(cinematicT * Math.PI) * 6; // Arc

        this.currentLookAt.lerpVectors(new THREE.Vector3(180, 140, -220), new THREE.Vector3(0, 1.5, 0), ease);
        this.camera.lookAt(this.currentLookAt);

        // Habitat lighting turns on progressively
        this.habitatInteriorLight.intensity = 0.2 + ease * 2.6;
      } else {
        this.isArrivalCinematic = false;
        this.controls.enabled = true;
        this.controls.target.copy(this.currentLookAt);
        this.callbacks.onCameraTransitionEnd?.();
      }
    }

    // 6. Camera Transition Lerp
    if (this.isCameraTransitioning) {
      this.cameraTransitionProgress += delta / this.cameraTransitionDuration;
      if (this.cameraTransitionProgress >= 1.0) {
        this.cameraTransitionProgress = 1.0;
        this.isCameraTransitioning = false;
        this.controls.enabled = true;
        this.controls.target.copy(this.cameraTargetLookAt);
        this.callbacks.onCameraTransitionEnd?.();
      }
      const t = this.easeInOutCubic(this.cameraTransitionProgress);
      this.camera.position.lerpVectors(this.cameraStartPos, this.cameraTargetPos, t);
      this.currentLookAt.lerpVectors(this.cameraStartLookAt, this.cameraTargetLookAt, t);
      this.camera.lookAt(this.currentLookAt);
    } else if (!this.isArrivalCinematic) {
      this.controls.update();
    }

    // 7. Crisis Alarm Flashing Light
    if (this.crisisAlarmLight.intensity > 0) {
      const flash = (Math.sin(elapsedTime * 8) + 1) * 0.5;
      this.crisisAlarmLight.intensity = flash * 3.5;
    }

    this.renderer.render(this.scene, this.camera);
  };

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  private onWindowResize = () => {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
