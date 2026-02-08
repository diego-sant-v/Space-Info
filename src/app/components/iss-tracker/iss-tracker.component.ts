import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { IssService } from '../../services/iss/iss.service';
import * as THREE from 'three';

@Component({
  selector: 'app-iss-tracker',
  templateUrl: './iss-tracker.component.html',
  styleUrls: ['./iss-tracker.component.scss']
})
export class IssTrackerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('globeCanvas', { static: false }) globeCanvas!: ElementRef<HTMLCanvasElement>;

  // ISS Data
  issData: any = { latitude: 0, longitude: 0, altitude: 408, velocity: 27600 };
  peopleInSpace: any[] = [];
  peopleCount = 0;
  isLoading = true;

  // Three.js
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private earth!: THREE.Mesh;
  private issMarker!: THREE.Mesh;
  private issOrbitLine!: THREE.Line;
  private clouds!: THREE.Mesh;
  private animationId!: number;
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private targetRotation = { x: 0, y: 0 };
  private currentRotation = { x: 0.3, y: 0 };

  // Trail
  private trailPoints: THREE.Vector3[] = [];
  private trailLine!: THREE.Line;

  private issSub!: Subscription;
  private peopleSub!: Subscription;

  constructor(private issService: IssService, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.peopleSub = this.issService.getPeopleInSpace().subscribe(data => {
      this.peopleInSpace = data.people || [];
      this.peopleCount = data.number || 0;
    });
  }

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.startTracking();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.issSub) this.issSub.unsubscribe();
    if (this.peopleSub) this.peopleSub.unsubscribe();
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer) this.renderer.dispose();
  }

  private initThreeJS(): void {
    const canvas = this.globeCanvas.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000011);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.z = 3.5;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Earth
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2233aa,
      emissive: 0x112244,
      specular: 0x333333,
      shininess: 25,
    });
    this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
    this.scene.add(this.earth);

    // Earth grid lines (longitude/latitude)
    this.addGridLines();

    // Atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(1.05, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.scene.add(atmosphere);

    // Outer glow
    const glowGeometry = new THREE.SphereGeometry(1.15, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
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
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(0.3, 0.6, 1.0, intensity * 0.4);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.scene.add(glow);

    // ISS Marker — child of earth so it rotates with the globe
    const issGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const issMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    this.issMarker = new THREE.Mesh(issGeometry, issMaterial);
    this.earth.add(this.issMarker);

    // ISS glow
    const issGlowGeometry = new THREE.SphereGeometry(0.10, 16, 16);
    const issGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.3,
    });
    const issGlow = new THREE.Mesh(issGlowGeometry, issGlowMaterial);
    this.issMarker.add(issGlow);

    // Trail line
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
      color: 0xff6644,
      transparent: true,
      opacity: 0.6,
    });
    this.trailLine = new THREE.Line(trailGeometry, trailMaterial);
    this.earth.add(this.trailLine);

    // Stars background
    this.addStars();

    // Lights
    const ambientLight = new THREE.AmbientLight(0x333366, 1);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    this.scene.add(sunLight);

    // Mouse events
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mouseleave', () => this.onMouseUp());
    canvas.addEventListener('wheel', (e) => this.onWheel(e));

    // Touch events
    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
    canvas.addEventListener('touchend', () => this.onMouseUp());

    // Resize
    window.addEventListener('resize', () => this.onResize());
  }

  private addGridLines(): void {
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.15,
    });

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const phi = (90 - lat) * (Math.PI / 180);
      const points: THREE.Vector3[] = [];
      for (let lng = 0; lng <= 360; lng += 5) {
        const theta = lng * (Math.PI / 180);
        const x = 1.005 * Math.sin(phi) * Math.cos(theta);
        const y = 1.005 * Math.cos(phi);
        const z = 1.005 * Math.sin(phi) * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      this.earth.add(new THREE.Line(geometry, gridMaterial));
    }

    // Longitude lines
    for (let lng = 0; lng < 360; lng += 30) {
      const theta = lng * (Math.PI / 180);
      const points: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        const phi = (90 - lat) * (Math.PI / 180);
        const x = 1.005 * Math.sin(phi) * Math.cos(theta);
        const y = 1.005 * Math.cos(phi);
        const z = 1.005 * Math.sin(phi) * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      this.earth.add(new THREE.Line(geometry, gridMaterial));
    }

    // Add continent outlines approximation using points
    this.addContinentDots();
  }

  private addContinentDots(): void {
    const dotMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const dotGeometry = new THREE.SphereGeometry(0.008, 4, 4);

    // Major cities/landmarks as reference points
    const locations = [
      // Americas
      { lat: 40.7, lng: -74 }, { lat: 34, lng: -118.2 }, { lat: -23.5, lng: -46.6 },
      { lat: -34.6, lng: -58.4 }, { lat: 19.4, lng: -99.1 }, { lat: 45.5, lng: -73.6 },
      { lat: 51.5, lng: -0.13 }, { lat: 48.9, lng: 2.35 }, { lat: 52.5, lng: 13.4 },
      { lat: 41.9, lng: 12.5 }, { lat: 40.4, lng: -3.7 }, { lat: 55.8, lng: 37.6 },
      // Asia
      { lat: 35.7, lng: 139.7 }, { lat: 39.9, lng: 116.4 }, { lat: 28.6, lng: 77.2 },
      { lat: 1.35, lng: 103.8 }, { lat: 37.6, lng: 127 }, { lat: 13.8, lng: 100.5 },
      // Africa
      { lat: 30, lng: 31.2 }, { lat: -1.3, lng: 36.8 }, { lat: -33.9, lng: 18.4 },
      { lat: 6.5, lng: 3.4 }, { lat: 33.6, lng: -7.6 },
      // Oceania
      { lat: -33.9, lng: 151.2 }, { lat: -36.8, lng: 174.8 },
    ];

    locations.forEach(loc => {
      const pos = this.latLngToVector3(loc.lat, loc.lng, 1.01);
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      dot.position.copy(pos);
      this.earth.add(dot);
    });
  }

  private addStars(): void {
    const starsGeometry = new THREE.BufferGeometry();
    const starsPositions: number[] = [];
    for (let i = 0; i < 3000; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      starsPositions.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.8 });
    this.scene.add(new THREE.Points(starsGeometry, starsMaterial));
  }

  private startTracking(): void {
    this.issSub = this.issService.trackISS(4000).subscribe(data => {
      this.ngZone.run(() => {
        this.issData = data;
        this.isLoading = false;
        this.updateISSPosition(data.latitude, data.longitude);
      });
    });
  }

  private updateISSPosition(lat: number, lng: number): void {
    const pos = this.latLngToVector3(lat, lng, 1.15);
    this.issMarker.position.copy(pos);

    // Add to trail
    this.trailPoints.push(pos.clone());
    if (this.trailPoints.length > 100) this.trailPoints.shift();
    const trailGeometry = new THREE.BufferGeometry().setFromPoints(this.trailPoints);
    this.trailLine.geometry.dispose();
    this.trailLine.geometry = trailGeometry;
  }

  private latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
  }

  private animate(): void {
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.animationId = requestAnimationFrame(loop);

        // Smooth rotation
        if (!this.isDragging) {
          this.targetRotation.y += 0.001;
        }
        this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.05;
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.05;

        this.earth.rotation.x = this.currentRotation.x;
        this.earth.rotation.y = this.currentRotation.y;

        // ISS pulse
        if (this.issMarker) {
          const scale = 1 + Math.sin(Date.now() * 0.005) * 0.3;
          this.issMarker.scale.set(scale, scale, scale);
        }

        this.renderer.render(this.scene, this.camera);
      };
      loop();
    });
  }

  // Mouse/Touch interactions
  private onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;
    this.targetRotation.y += deltaX * 0.005;
    this.targetRotation.x += deltaY * 0.005;
    this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onTouchStart(e: TouchEvent): void {
    this.isDragging = true;
    this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.isDragging) return;
    e.preventDefault();
    const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
    const deltaY = e.touches[0].clientY - this.previousMousePosition.y;
    this.targetRotation.y += deltaX * 0.005;
    this.targetRotation.x += deltaY * 0.005;
    this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
    this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.camera.position.z += e.deltaY * 0.002;
    this.camera.position.z = Math.max(2, Math.min(8, this.camera.position.z));
  }

  private onResize(): void {
    const canvas = this.globeCanvas.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
