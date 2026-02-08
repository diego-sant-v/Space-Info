import { Component, OnDestroy, ElementRef, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import * as THREE from 'three';

interface StarData {
  name: string;
  ra: number;  // right ascension in degrees
  dec: number; // declination in degrees
  mag: number; // magnitude (brightness)
  color: number;
}

interface ConstellationData {
  name: string;
  namePt: string;
  stars: number[][]; // pairs of [ra, dec] for star positions
  lines: number[][]; // pairs of indices into stars array
  description: string;
}

@Component({
  selector: 'app-star-map',
  templateUrl: './star-map.component.html',
  styleUrls: ['./star-map.component.scss']
})
export class StarMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('starCanvas', { static: false }) starCanvas!: ElementRef<HTMLCanvasElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationId!: number;

  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private cameraAngleX = 0;
  private cameraAngleY = 0;
  private fov = 60;

  showConstellations = true;
  showGrid = false;
  showLabels = true;
  selectedConstellation: ConstellationData | null = null;
  autoRotate = false;

  private constellationLines: THREE.Group = new THREE.Group();
  private labelsGroup: THREE.Group = new THREE.Group();
  private gridGroup: THREE.Group = new THREE.Group();

  constellations: ConstellationData[] = [
    {
      name: 'Orion', namePt: 'Órion',
      stars: [[88.8, 7.4], [81.3, 6.3], [83.0, -0.3], [78.6, -8.2], [84.1, -1.2], [86.9, -1.9], [80.0, -1.4], [88.1, 20.1], [77.5, 8.9]],
      lines: [[0, 4], [1, 6], [4, 5], [5, 3], [6, 4], [7, 0], [8, 1], [2, 4], [2, 5]],
      description: 'Uma das constelações mais reconhecíveis, representando o caçador mitológico. Contém Betelgeuse e Rigel.'
    },
    {
      name: 'Ursa Major', namePt: 'Ursa Maior',
      stars: [[165.5, 61.8], [166.0, 56.4], [178.5, 53.7], [183.9, 57.0], [193.5, 55.0], [200.9, 54.9], [206.9, 49.3]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [3, 0]],
      description: 'O Grande Carro — uma das constelações mais famosas do hemisfério norte.'
    },
    {
      name: 'Scorpius', namePt: 'Escorpião',
      stars: [[247.4, -26.4], [252.2, -22.6], [253.1, -38.0], [248.0, -28.2], [245.3, -25.6], [241.4, -19.8], [240.1, -22.6], [263.4, -37.1], [258.0, -43.2], [262.7, -42.5]],
      lines: [[5, 6], [6, 4], [4, 3], [3, 0], [0, 1], [0, 2], [2, 8], [8, 9], [9, 7]],
      description: 'Constelação zodiacal do hemisfério sul, com a supergigante vermelha Antares.'
    },
    {
      name: 'Crux', namePt: 'Cruzeiro do Sul',
      stars: [[186.6, -63.1], [187.8, -57.1], [191.9, -59.7], [183.8, -59.7]],
      lines: [[0, 1], [2, 3]],
      description: 'A menor constelação mas uma das mais famosas, símbolo do hemisfério sul e presente na bandeira do Brasil.'
    },
    {
      name: 'Cassiopeia', namePt: 'Cassiopeia',
      stars: [[2.3, 59.2], [10.1, 56.5], [14.2, 60.7], [21.5, 60.2], [28.6, 63.7]],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
      description: 'Constelação em forma de W ou M, facilmente visível no hemisfério norte ao longo de todo o ano.'
    },
    {
      name: 'Leo', namePt: 'Leão',
      stars: [[152.1, 11.97], [148.2, 26.0], [154.2, 23.4], [146.5, 14.6], [168.5, 15.4], [177.3, 14.6], [170.0, 11.8]],
      lines: [[0, 3], [3, 1], [1, 2], [2, 0], [0, 4], [4, 6], [6, 5]],
      description: 'Constelação zodiacal que representa o Leão de Nemeia derrotado por Hércules.'
    },
    {
      name: 'Canis Major', namePt: 'Cão Maior',
      stars: [[101.3, -16.7], [95.7, -17.96], [104.7, -28.97], [107.1, -26.4], [105.4, -23.8], [97.2, -27.9]],
      lines: [[0, 1], [0, 4], [4, 3], [3, 2], [1, 5], [5, 2]],
      description: 'Abriga Sirius, a estrela mais brilhante do céu noturno, o "cão" que acompanha Órion.'
    },
    {
      name: 'Centaurus', namePt: 'Centauro',
      stars: [[219.9, -60.8], [210.95, -60.37], [206.9, -47.3], [200.1, -36.7], [190.4, -48.9], [204.0, -53.5]],
      lines: [[0, 1], [1, 5], [5, 4], [4, 3], [5, 2], [2, 3]],
      description: 'Grande constelação do hemisfério sul. Alfa Centauri é o sistema estelar mais próximo do Sol.'
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
    const canvas = this.starCanvas.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020210);

    this.camera = new THREE.PerspectiveCamera(this.fov, width / height, 0.1, 2000);
    this.camera.position.set(0, 0, 0.01);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Background stars (random field)
    this.createStarField();

    // Grid (celestial)
    this.createCelestialGrid();
    this.scene.add(this.gridGroup);
    this.gridGroup.visible = this.showGrid;

    // Constellation lines
    this.createConstellationLines();
    this.scene.add(this.constellationLines);

    // Milky Way band (faint glow)
    this.createMilkyWay();

    // Events
    canvas.addEventListener('mousedown', (e) => { this.isDragging = true; this.previousMousePosition = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('mousemove', (e) => this.onDrag(e.clientX, e.clientY));
    canvas.addEventListener('mouseup', () => this.isDragging = false);
    canvas.addEventListener('mouseleave', () => this.isDragging = false);
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.fov = Math.max(15, Math.min(100, this.fov + e.deltaY * 0.05)); this.camera.fov = this.fov; this.camera.updateProjectionMatrix(); });
    canvas.addEventListener('touchstart', (e) => { this.isDragging = true; this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }; });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); this.onDrag(e.touches[0].clientX, e.touches[0].clientY); });
    canvas.addEventListener('touchend', () => this.isDragging = false);
    window.addEventListener('resize', () => this.onResize());
  }

  private createStarField(): void {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    // Bright named stars in approximate positions
    const brightStars: StarData[] = [
      { name: 'Sirius', ra: 101.3, dec: -16.7, mag: -1.46, color: 0xaabbff },
      { name: 'Canopus', ra: 95.99, dec: -52.7, mag: -0.72, color: 0xffffff },
      { name: 'Arcturus', ra: 213.9, dec: 19.2, mag: -0.05, color: 0xffbb66 },
      { name: 'Vega', ra: 279.2, dec: 38.8, mag: 0.03, color: 0xaaccff },
      { name: 'Rigel', ra: 78.6, dec: -8.2, mag: 0.13, color: 0x99bbff },
      { name: 'Betelgeuse', ra: 88.8, dec: 7.4, mag: 0.42, color: 0xff7744 },
      { name: 'Antares', ra: 247.4, dec: -26.4, mag: 0.96, color: 0xff4422 },
      { name: 'Polaris', ra: 37.95, dec: 89.26, mag: 1.98, color: 0xffeeaa },
      { name: 'Alfa Centauri', ra: 219.9, dec: -60.8, mag: -0.27, color: 0xffee88 },
    ];

    // Place bright stars
    brightStars.forEach(star => {
      const pos = this.raDecToVec3(star.ra, star.dec, 100);
      positions.push(pos.x, pos.y, pos.z);
      const c = new THREE.Color(star.color);
      colors.push(c.r, c.g, c.b);
      sizes.push(Math.max(1.5, 4 - star.mag));
    });

    // Random background stars
    for (let i = 0; i < 8000; i++) {
      const ra = Math.random() * 360;
      const dec = (Math.asin(Math.random() * 2 - 1) * 180) / Math.PI;
      const pos = this.raDecToVec3(ra, dec, 95 + Math.random() * 10);
      positions.push(pos.x, pos.y, pos.z);

      const temp = Math.random();
      let color: THREE.Color;
      if (temp < 0.2) color = new THREE.Color(0xff8866);
      else if (temp < 0.4) color = new THREE.Color(0xffddaa);
      else if (temp < 0.7) color = new THREE.Color(0xffffff);
      else color = new THREE.Color(0xaabbff);
      colors.push(color.r, color.g, color.b);
      sizes.push(Math.random() * 1.5 + 0.3);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      vertexColors: true,
      size: 1,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
    });

    this.scene.add(new THREE.Points(geometry, material));
  }

  private createConstellationLines(): void {
    this.constellations.forEach(constellation => {
      const group = new THREE.Group();

      // Draw lines
      constellation.lines.forEach(line => {
        const start = constellation.stars[line[0]];
        const end = constellation.stars[line[1]];
        const p1 = this.raDecToVec3(start[0], start[1], 95);
        const p2 = this.raDecToVec3(end[0], end[1], 95);

        const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const mat = new THREE.LineBasicMaterial({ color: 0x4466aa, transparent: true, opacity: 0.5 });
        group.add(new THREE.Line(geo, mat));
      });

      // Star dots for constellation
      constellation.stars.forEach(star => {
        const pos = this.raDecToVec3(star[0], star[1], 95);
        const dotGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0x88aaff });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.copy(pos);
        group.add(dot);
      });

      this.constellationLines.add(group);
    });
  }

  private createCelestialGrid(): void {
    // Declination circles
    for (let dec = -60; dec <= 60; dec += 30) {
      const points: THREE.Vector3[] = [];
      for (let ra = 0; ra <= 360; ra += 2) {
        points.push(this.raDecToVec3(ra, dec, 90));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: 0x112244, transparent: true, opacity: 0.2 });
      this.gridGroup.add(new THREE.Line(geo, mat));
    }

    // Right Ascension lines
    for (let ra = 0; ra < 360; ra += 30) {
      const points: THREE.Vector3[] = [];
      for (let dec = -90; dec <= 90; dec += 2) {
        points.push(this.raDecToVec3(ra, dec, 90));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: 0x112244, transparent: true, opacity: 0.2 });
      this.gridGroup.add(new THREE.Line(geo, mat));
    }
  }

  private createMilkyWay(): void {
    const milkyWayGeometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < 3000; i++) {
      const ra = Math.random() * 360;
      const baseDec = Math.sin(ra * Math.PI / 180) * 30;
      const dec = baseDec + (Math.random() - 0.5) * 25;
      const pos = this.raDecToVec3(ra, dec, 85 + Math.random() * 10);
      positions.push(pos.x, pos.y, pos.z);
      const brightness = 0.1 + Math.random() * 0.15;
      colors.push(brightness * 0.8, brightness * 0.85, brightness);
    }

    milkyWayGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    milkyWayGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({ vertexColors: true, size: 0.8, sizeAttenuation: true, transparent: true, opacity: 0.4 });
    this.scene.add(new THREE.Points(milkyWayGeometry, mat));
  }

  private raDecToVec3(ra: number, dec: number, radius: number): THREE.Vector3 {
    const raRad = (ra * Math.PI) / 180;
    const decRad = (dec * Math.PI) / 180;
    return new THREE.Vector3(
      radius * Math.cos(decRad) * Math.cos(raRad),
      radius * Math.sin(decRad),
      -radius * Math.cos(decRad) * Math.sin(raRad)
    );
  }

  private onDrag(clientX: number, clientY: number): void {
    if (!this.isDragging) return;
    const dx = clientX - this.previousMousePosition.x;
    const dy = clientY - this.previousMousePosition.y;
    this.cameraAngleY -= dx * 0.003;
    this.cameraAngleX = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.cameraAngleX + dy * 0.003));
    this.previousMousePosition = { x: clientX, y: clientY };
  }

  private animate(): void {
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.animationId = requestAnimationFrame(loop);

        if (this.autoRotate) {
          this.cameraAngleY += 0.0005;
        }

        // Update camera direction
        const target = new THREE.Vector3(
          Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY),
          Math.sin(this.cameraAngleX),
          -Math.cos(this.cameraAngleX) * Math.sin(this.cameraAngleY)
        );
        this.camera.lookAt(target.multiplyScalar(100));

        this.constellationLines.visible = this.showConstellations;
        this.gridGroup.visible = this.showGrid;

        this.renderer.render(this.scene, this.camera);
      };
      loop();
    });
  }

  selectConstellation(constellation: ConstellationData): void {
    this.selectedConstellation = constellation;
    // Center camera on constellation
    const avgRA = constellation.stars.reduce((sum, s) => sum + s[0], 0) / constellation.stars.length;
    const avgDec = constellation.stars.reduce((sum, s) => sum + s[1], 0) / constellation.stars.length;
    this.cameraAngleY = -(avgRA * Math.PI) / 180;
    this.cameraAngleX = (avgDec * Math.PI) / 180;
  }

  closeInfo(): void {
    this.selectedConstellation = null;
  }

  toggleConstellations(): void {
    this.showConstellations = !this.showConstellations;
  }

  toggleGrid(): void {
    this.showGrid = !this.showGrid;
  }

  toggleAutoRotate(): void {
    this.autoRotate = !this.autoRotate;
  }

  private onResize(): void {
    const canvas = this.starCanvas.nativeElement;
    this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  }
}
