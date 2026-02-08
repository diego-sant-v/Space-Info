import { Component, OnDestroy, ElementRef, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import * as THREE from 'three';

interface PlanetData {
  name: string;
  namePt: string;
  radius: number;
  distance: number;
  speed: number;
  orbitalPeriodDays: number;
  color: number;
  emissive: number;
  description: string;
  facts: { label: string; value: string }[];
  ring?: { innerRadius: number; outerRadius: number; color: number };
  mesh?: THREE.Mesh;
  orbit?: THREE.Line;
  angle: number;
  moons?: number;
}

@Component({
  selector: 'app-solar-system',
  templateUrl: './solar-system.component.html',
  styleUrls: ['./solar-system.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class SolarSystemComponent implements AfterViewInit, OnDestroy {
  @ViewChild('solarCanvas', { static: false }) solarCanvas!: ElementRef<HTMLCanvasElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationId!: number;
  private sun!: THREE.Mesh;

  // Camera controls
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private cameraAngleX = 0.6;
  private cameraAngleY = 0;
  private cameraDistance = 60;

  selectedPlanet: PlanetData | null = null;
  speedMultiplier = 1;
  showOrbits = true;
  useRealSpeed = false;
  elapsedDays = 0;
  private lastTimestamp = 0;

  // Real speed: 1 second real time = 1 Earth day simulated
  // So Mercury (88 days) completes orbit in ~88 seconds
  // Earth (365 days) in ~6 minutes, Jupiter in ~12 years of real time
  // Base angular speed: 2π / (orbitalPeriod * 60fps)
  private readonly REAL_SPEED_SCALE = 1 / 60; // 1 day per second at 60fps

  planets: PlanetData[] = [
    {
      name: 'Mercury', namePt: 'Mercúrio', radius: 0.4, distance: 6, speed: 0.04, orbitalPeriodDays: 88,
      color: 0xaaaaaa, emissive: 0x333333, angle: Math.random() * Math.PI * 2,
      description: 'O menor planeta do Sistema Solar e o mais próximo do Sol.',
      facts: [
        { label: 'Diâmetro', value: '4.879 km' },
        { label: 'Distância do Sol', value: '57.9 milhões km' },
        { label: 'Período orbital', value: '88 dias' },
        { label: 'Temperatura', value: '-180°C a 430°C' },
        { label: 'Luas', value: '0' }
      ]
    },
    {
      name: 'Venus', namePt: 'Vênus', radius: 0.7, distance: 9, speed: 0.015, orbitalPeriodDays: 225,
      color: 0xffcc66, emissive: 0x553300, angle: Math.random() * Math.PI * 2,
      description: 'O planeta mais quente, com atmosfera densa de CO2.',
      facts: [
        { label: 'Diâmetro', value: '12.104 km' },
        { label: 'Distância do Sol', value: '108.2 milhões km' },
        { label: 'Período orbital', value: '225 dias' },
        { label: 'Temperatura', value: '462°C' },
        { label: 'Luas', value: '0' }
      ]
    },
    {
      name: 'Earth', namePt: 'Terra', radius: 0.75, distance: 12, speed: 0.01, orbitalPeriodDays: 365.25,
      color: 0x2244cc, emissive: 0x112244, angle: Math.random() * Math.PI * 2,
      description: 'Nosso lar, o único planeta com vida conhecida.',
      facts: [
        { label: 'Diâmetro', value: '12.742 km' },
        { label: 'Distância do Sol', value: '149.6 milhões km' },
        { label: 'Período orbital', value: '365.25 dias' },
        { label: 'Temperatura', value: '-89°C a 57°C' },
        { label: 'Luas', value: '1' }
      ],
      moons: 1
    },
    {
      name: 'Mars', namePt: 'Marte', radius: 0.55, distance: 16, speed: 0.008, orbitalPeriodDays: 687,
      color: 0xcc4422, emissive: 0x441100, angle: Math.random() * Math.PI * 2,
      description: 'O Planeta Vermelho, alvo de futuras missões tripuladas.',
      facts: [
        { label: 'Diâmetro', value: '6.779 km' },
        { label: 'Distância do Sol', value: '227.9 milhões km' },
        { label: 'Período orbital', value: '687 dias' },
        { label: 'Temperatura', value: '-140°C a 20°C' },
        { label: 'Luas', value: '2' }
      ],
      moons: 2
    },
    {
      name: 'Jupiter', namePt: 'Júpiter', radius: 2.2, distance: 24, speed: 0.004, orbitalPeriodDays: 4333,
      color: 0xddaa77, emissive: 0x443322, angle: Math.random() * Math.PI * 2,
      description: 'O maior planeta do Sistema Solar, um gigante gasoso.',
      facts: [
        { label: 'Diâmetro', value: '139.820 km' },
        { label: 'Distância do Sol', value: '778.5 milhões km' },
        { label: 'Período orbital', value: '11.86 anos' },
        { label: 'Temperatura', value: '-108°C' },
        { label: 'Luas', value: '95' }
      ],
      moons: 4
    },
    {
      name: 'Saturn', namePt: 'Saturno', radius: 1.8, distance: 32, speed: 0.003, orbitalPeriodDays: 10759,
      color: 0xeecc88, emissive: 0x443311, angle: Math.random() * Math.PI * 2,
      ring: { innerRadius: 2.2, outerRadius: 3.5, color: 0xddcc99 },
      description: 'Famoso por seus espetaculares anéis de gelo e rocha.',
      facts: [
        { label: 'Diâmetro', value: '116.460 km' },
        { label: 'Distância do Sol', value: '1.434 bilhões km' },
        { label: 'Período orbital', value: '29.46 anos' },
        { label: 'Temperatura', value: '-139°C' },
        { label: 'Luas', value: '146' }
      ]
    },
    {
      name: 'Uranus', namePt: 'Urano', radius: 1.2, distance: 40, speed: 0.002, orbitalPeriodDays: 30687,
      color: 0x88ccdd, emissive: 0x224444, angle: Math.random() * Math.PI * 2,
      ring: { innerRadius: 1.5, outerRadius: 2.0, color: 0x88bbcc },
      description: 'O gigante de gelo que gira quase deitado.',
      facts: [
        { label: 'Diâmetro', value: '50.724 km' },
        { label: 'Distância do Sol', value: '2.871 bilhões km' },
        { label: 'Período orbital', value: '84.01 anos' },
        { label: 'Temperatura', value: '-197°C' },
        { label: 'Luas', value: '28' }
      ]
    },
    {
      name: 'Neptune', namePt: 'Netuno', radius: 1.1, distance: 48, speed: 0.001, orbitalPeriodDays: 60190,
      color: 0x3344dd, emissive: 0x112266, angle: Math.random() * Math.PI * 2,
      description: 'O planeta mais distante, com ventos supersônicos.',
      facts: [
        { label: 'Diâmetro', value: '49.244 km' },
        { label: 'Distância do Sol', value: '4.495 bilhões km' },
        { label: 'Período orbital', value: '164.8 anos' },
        { label: 'Temperatura', value: '-201°C' },
        { label: 'Luas', value: '16' }
      ]
    }
  ];

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.initScene();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer) this.renderer.dispose();
  }

  private initScene(): void {
    const canvas = this.solarCanvas.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000008);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Stars
    const starsGeometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    for (let i = 0; i < 5000; i++) {
      positions.push((Math.random() - 0.5) * 400, (Math.random() - 0.5) * 400, (Math.random() - 0.5) * 400);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 })));

    // Sun
    const sunGeometry = new THREE.SphereGeometry(3, 48, 48);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.scene.add(this.sun);

    // Sun glow
    const sunGlowGeo = new THREE.SphereGeometry(3.8, 32, 32);
    const sunGlowMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(1.0, 0.8, 0.2, intensity * 0.6);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    this.scene.add(new THREE.Mesh(sunGlowGeo, sunGlowMat));

    // Sun point light
    const sunLight = new THREE.PointLight(0xffffff, 2, 200);
    this.scene.add(sunLight);
    this.scene.add(new THREE.AmbientLight(0x222233, 0.5));

    // Planets
    this.planets.forEach(planet => {
      // Planet mesh
      const geo = new THREE.SphereGeometry(planet.radius, 32, 32);
      const mat = new THREE.MeshPhongMaterial({
        color: planet.color,
        emissive: planet.emissive,
        specular: 0x222222,
        shininess: 15,
      });
      planet.mesh = new THREE.Mesh(geo, mat);
      this.scene.add(planet.mesh);

      // Ring
      if (planet.ring) {
        const ringGeo = new THREE.RingGeometry(planet.ring.innerRadius, planet.ring.outerRadius, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: planet.ring.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.5;
        planet.mesh.add(ring);
      }

      // Moons
      if (planet.moons) {
        for (let i = 0; i < Math.min(planet.moons, 4); i++) {
          const moonGeo = new THREE.SphereGeometry(planet.radius * 0.15, 16, 16);
          const moonMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, emissive: 0x333333 });
          const moon = new THREE.Mesh(moonGeo, moonMat);
          planet.mesh.add(moon);
          (moon as any).moonAngle = Math.random() * Math.PI * 2;
          (moon as any).moonDistance = planet.radius * 2 + i * planet.radius * 0.8;
          (moon as any).moonSpeed = 0.02 + i * 0.01;
        }
      }

      // Orbit line
      const orbitPoints: THREE.Vector3[] = [];
      for (let i = 0; i <= 128; i++) {
        const angle = (i / 128) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(
          Math.cos(angle) * planet.distance,
          0,
          Math.sin(angle) * planet.distance
        ));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMat = new THREE.LineBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.3 });
      planet.orbit = new THREE.Line(orbitGeo, orbitMat);
      this.scene.add(planet.orbit);
    });

    // Events
    canvas.addEventListener('mousedown', (e) => { this.isDragging = true; this.previousMousePosition = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('mousemove', (e) => this.onDrag(e.clientX, e.clientY));
    canvas.addEventListener('mouseup', () => this.isDragging = false);
    canvas.addEventListener('mouseleave', () => this.isDragging = false);
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.cameraDistance = Math.max(10, Math.min(120, this.cameraDistance + e.deltaY * 0.05)); });
    canvas.addEventListener('touchstart', (e) => { this.isDragging = true; this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }; });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); this.onDrag(e.touches[0].clientX, e.touches[0].clientY); });
    canvas.addEventListener('touchend', () => this.isDragging = false);
    canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    window.addEventListener('resize', () => this.onResize());
  }

  private onDrag(clientX: number, clientY: number): void {
    if (!this.isDragging) return;
    const dx = clientX - this.previousMousePosition.x;
    const dy = clientY - this.previousMousePosition.y;
    this.cameraAngleY += dx * 0.005;
    this.cameraAngleX = Math.max(0.1, Math.min(Math.PI / 2.1, this.cameraAngleX + dy * 0.005));
    this.previousMousePosition = { x: clientX, y: clientY };
  }

  private onCanvasClick(event: MouseEvent): void {
    const canvas = this.solarCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    for (const planet of this.planets) {
      if (planet.mesh) {
        const intersects = raycaster.intersectObject(planet.mesh);
        if (intersects.length > 0) {
          this.ngZone.run(() => this.selectedPlanet = planet);
          return;
        }
      }
    }
  }

  private updateCameraPosition(): void {
    this.camera.position.x = this.cameraDistance * Math.sin(this.cameraAngleX) * Math.cos(this.cameraAngleY);
    this.camera.position.y = this.cameraDistance * Math.cos(this.cameraAngleX);
    this.camera.position.z = this.cameraDistance * Math.sin(this.cameraAngleX) * Math.sin(this.cameraAngleY);
    this.camera.lookAt(0, 0, 0);
  }

  private animate(): void {
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.animationId = requestAnimationFrame(loop);
        this.updateCameraPosition();

        // Sun rotation + pulse
        this.sun.rotation.y += 0.002;
        const sunScale = 1 + Math.sin(Date.now() * 0.001) * 0.02;
        this.sun.scale.set(sunScale, sunScale, sunScale);

        // Track elapsed time for real speed mode
        if (this.useRealSpeed) {
          this.elapsedDays += this.REAL_SPEED_SCALE * this.speedMultiplier;
        }

        // Planets
        this.planets.forEach(planet => {
          if (!planet.mesh) return;
          const effectiveSpeed = this.useRealSpeed
            ? (2 * Math.PI / planet.orbitalPeriodDays) * this.REAL_SPEED_SCALE
            : planet.speed;
          planet.angle += effectiveSpeed * this.speedMultiplier;
          planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
          planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
          planet.mesh.rotation.y += 0.01;

          // Moons
          planet.mesh.children.forEach(child => {
            if ((child as any).moonAngle !== undefined) {
              const moonEffectiveSpeed = this.useRealSpeed
                ? (child as any).moonSpeed * this.REAL_SPEED_SCALE * 0.5
                : (child as any).moonSpeed;
              (child as any).moonAngle += moonEffectiveSpeed * this.speedMultiplier;
              child.position.x = Math.cos((child as any).moonAngle) * (child as any).moonDistance;
              child.position.z = Math.sin((child as any).moonAngle) * (child as any).moonDistance;
            }
          });

          // Orbit visibility
          if (planet.orbit) {
            planet.orbit.visible = this.showOrbits;
          }
        });

        this.renderer.render(this.scene, this.camera);
      };
      loop();
    });
  }

  selectPlanet(planet: PlanetData): void {
    this.selectedPlanet = planet;
  }

  closePlanetInfo(): void {
    this.selectedPlanet = null;
  }

  toggleOrbits(): void {
    this.showOrbits = !this.showOrbits;
  }

  setSpeed(speed: number): void {
    this.speedMultiplier = speed;
  }

  toggleRealSpeed(): void {
    this.useRealSpeed = !this.useRealSpeed;
    this.elapsedDays = 0;
  }

  getElapsedTimeLabel(): string {
    if (this.elapsedDays < 1) return `${(this.elapsedDays * 24).toFixed(0)} horas`;
    if (this.elapsedDays < 365) return `${this.elapsedDays.toFixed(0)} dias`;
    return `${(this.elapsedDays / 365.25).toFixed(1)} anos`;
  }

  private onResize(): void {
    const canvas = this.solarCanvas.nativeElement;
    this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  }
}
