import { Component, OnDestroy, ElementRef, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// ============================================================================
// SHADER: Quasar (núcleo galáctico ativo - AGN) baseado no modelo do buraco
// negro deste projeto. Um quasar é um buraco negro supermassivo alimentado por
// um disco de acreção extremamente quente (~10^4-10^5 K, emissão térmica
// azul/UV) que lança jatos relativísticos bipolares colimados ao longo do
// eixo de rotação. Fenômenos físicos representados:
//  - Lente gravitacional (curvatura dos raios pela métrica de Schwarzschild)
//  - Disco de acreção com perfil de temperatura ~ r^-3/4 (Shakura-Sunyaev)
//  - Efeito Doppler relativístico no disco (lado que se aproxima mais brilhante)
//  - Jatos bipolares com beaming relativístico (jato que aponta para o
//    observador é fortemente amplificado - por isso muitos quasares parecem
//    ter um único jato)
//  - Corona quente de raios-X próxima ao horizonte de eventos
// ============================================================================

const VERTEX_SHADER = /* glsl */ `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uBlackHoleMass;
  uniform float uDiskInnerRadius;
  uniform float uDiskOuterRadius;
  uniform float uDiskTemperature;
  uniform float uTemperatureFalloff;
  uniform float uDiskBrightness;
  uniform float uDiskRotationSpeed;
  uniform float uTurbulenceScale;
  uniform float uTurbulenceStretch;
  uniform float uTurbulenceSharpness;
  uniform float uTurbulenceCycleTime;
  uniform float uTurbulenceLacunarity;
  uniform float uTurbulencePersistence;
  uniform float uDiskEdgeSoftnessInner;
  uniform float uDiskEdgeSoftnessOuter;
  uniform float uGravitationalLensing;
  uniform float uDopplerStrength;
  uniform float uStepSize;
  uniform float uJetLength;
  uniform float uJetBaseRadius;
  uniform float uJetOpeningAngle;
  uniform float uJetBrightness;
  uniform float uJetSpeed;
  uniform float uJetBeta;
  uniform float uBeamingStrength;
  uniform vec3 uJetColor;
  uniform vec3 uJetCoreColor;
  uniform float uCoronaBrightness;
  uniform vec3 uCoronaColor;
  uniform float uStarsEnabled;
  uniform vec3 uStarBackgroundColor;
  uniform float uStarDensity;
  uniform float uStarSize;
  uniform float uStarBrightness;
  uniform float uNebulaEnabled;
  uniform float uNebula1Scale;
  uniform float uNebula1Density;
  uniform float uNebula1Brightness;
  uniform vec3 uNebula1Color;
  uniform float uNebula2Scale;
  uniform float uNebula2Density;
  uniform float uNebula2Brightness;
  uniform vec3 uNebula2Color;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uCameraPosition;
  uniform vec3 uCameraTarget;

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float hash31(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  vec2 hash22(vec2 p) {
    float px = fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    float py = fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453);
    return vec2(px, py);
  }

  float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    float a = hash31(i);
    float b = hash31(i + vec3(1.0, 0.0, 0.0));
    float c = hash31(i + vec3(0.0, 1.0, 0.0));
    float d = hash31(i + vec3(1.0, 1.0, 0.0));
    float e = hash31(i + vec3(0.0, 0.0, 1.0));
    float f2 = hash31(i + vec3(1.0, 0.0, 1.0));
    float g = hash31(i + vec3(0.0, 1.0, 1.0));
    float h = hash31(i + vec3(1.0, 1.0, 1.0));
    return mix(
      mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
      mix(mix(e, f2, u.x), mix(g, h, u.x), u.y),
      u.z
    );
  }

  float fbm(vec3 p, float lacunarity, float persistence) {
    float value = 0.0;
    float amplitude = 0.5;
    vec3 pos = p;
    value += noise3D(pos) * amplitude;
    pos *= lacunarity; amplitude *= persistence;
    value += noise3D(pos) * amplitude;
    pos *= lacunarity; amplitude *= persistence;
    value += noise3D(pos) * amplitude;
    pos *= lacunarity; amplitude *= persistence;
    value += noise3D(pos) * amplitude;
    return value;
  }

  vec3 blackbodyColor(float tempK) {
    float t = clamp((tempK - 1000.0) / 9000.0, 0.0, 1.0);
    float red = clamp(1.0 - (t - 0.8) * 2.0, 0.5, 1.0);
    float green = smoothstep(0.0, 0.5, t) * (1.0 - max((t - 0.7) * 0.3, 0.0));
    float blue = smoothstep(0.3, 1.0, t) * t;
    return vec3(red, green, blue);
  }

  vec3 starField(vec3 rayDir) {
    float theta = atan(rayDir.z, rayDir.x);
    float phi = asin(clamp(rayDir.y, -1.0, 1.0));
    float gridScale = 60.0 / uStarSize;
    vec2 scaledCoord = vec2(theta, phi) * gridScale;
    vec2 cell = floor(scaledCoord);
    vec2 cellUV = fract(scaledCoord);
    float cellHash = hash21(cell);
    float starProb = step(1.0 - uStarDensity, cellHash);
    vec2 starPos = hash22(cell + 42.0) * 0.8 + 0.1;
    float distToStar = length(cellUV - starPos);
    float baseSizeVar = hash21(cell + 100.0) * 0.03 + 0.01;
    float finalStarSize = baseSizeVar * uStarSize;
    float starCore = smoothstep(finalStarSize, 0.0, distToStar);
    float starGlow = smoothstep(finalStarSize * 3.0, 0.0, distToStar) * 0.3;
    float starIntensity = (starCore + starGlow) * starProb;
    float colorTemp = hash21(cell + 200.0);
    vec3 starColor = mix(vec3(0.8, 0.9, 1.0), vec3(1.0, 0.95, 0.8), colorTemp);
    return starColor * starIntensity * uStarBrightness;
  }

  vec3 nebulaField(vec3 rayDir) {
    vec3 noisePos1 = rayDir * uNebula1Scale;
    float n1 = fbm(noisePos1, 2.0, 0.5) * 2.0 - 1.0;
    float layer1 = clamp(n1 + uNebula1Density, 0.0, 1.0);
    vec3 color1 = uNebula1Color * layer1 * uNebula1Brightness;
    vec3 noisePos2 = rayDir * uNebula2Scale;
    float n2 = fbm(noisePos2, 2.0, 0.5) * 2.0 - 1.0;
    float layer2 = clamp(n2 + uNebula2Density, 0.0, 1.0);
    vec3 color2 = uNebula2Color * layer2 * uNebula2Brightness;
    return color1 + color2;
  }

  vec4 accretionDiskColor(float hitR, float hitAngle, float time, vec3 rayDir) {
    float innerR = uDiskInnerRadius;
    float outerR = uDiskOuterRadius;
    float normR = clamp((hitR - innerR) / (outerR - innerR), 0.0, 1.0);

    // Perfil de temperatura tipo Shakura-Sunyaev: T ~ (r_in / r)^falloff
    float peakTempK = uDiskTemperature * 1000.0;
    float outerTempK = 2500.0;
    float tempFalloff = pow(innerR / hitR, uTemperatureFalloff);
    float tempK = mix(outerTempK, peakTempK, tempFalloff);
    vec3 diskColor = blackbodyColor(tempK);

    // Doppler relativístico: gás em órbita kepleriana (v ~ 1/sqrt(r))
    float rotationSign = sign(uDiskRotationSpeed);
    vec3 velocityDir = vec3(
      -sin(hitAngle) * rotationSign,
      0.0,
      cos(hitAngle) * rotationSign
    );
    float velocityMagnitude = 1.0 / sqrt(hitR / innerR);
    float beta = velocityMagnitude * 0.35;
    float cosTheta = dot(velocityDir, rayDir);
    float dopplerFactor = 1.0 / (1.0 - beta * cosTheta);
    float dopplerBoost = pow(abs(dopplerFactor), 3.0 * uDopplerStrength);
    diskColor *= clamp(dopplerBoost, 0.1, 6.0);

    float edgeFalloff = smoothstep(0.0, uDiskEdgeSoftnessInner, normR) *
      smoothstep(1.0, 1.0 - uDiskEdgeSoftnessOuter, normR);

    float cycleLength = uTurbulenceCycleTime;
    float cyclicTime = mod(time, cycleLength);
    float blendFactor = cyclicTime / cycleLength;
    float keplerianPhase1 = cyclicTime * uDiskRotationSpeed / pow(hitR, 1.5);
    float keplerianPhase2 = (cyclicTime + cycleLength) * uDiskRotationSpeed / pow(hitR, 1.5);
    float rotatedAngle1 = hitAngle + keplerianPhase1;
    float rotatedAngle2 = hitAngle + keplerianPhase2;
    vec3 noiseCoord1 = vec3(
      hitR * uTurbulenceScale,
      cos(rotatedAngle1) / max(uTurbulenceStretch, 0.1),
      sin(rotatedAngle1) / max(uTurbulenceStretch, 0.1)
    );
    vec3 noiseCoord2 = vec3(
      hitR * uTurbulenceScale,
      cos(rotatedAngle2) / max(uTurbulenceStretch, 0.1),
      sin(rotatedAngle2) / max(uTurbulenceStretch, 0.1)
    );
    float turbulence1 = fbm(noiseCoord1, uTurbulenceLacunarity, uTurbulencePersistence);
    float turbulence2 = fbm(noiseCoord2, uTurbulenceLacunarity, uTurbulencePersistence);
    float turbulence = mix(turbulence2, turbulence1, blendFactor);
    float ringOpacity = pow(clamp(turbulence, 0.0, 1.0), uTurbulenceSharpness);

    float finalOpacity = ringOpacity * edgeFalloff;
    vec3 finalColor = diskColor * uDiskBrightness;
    return vec4(finalColor, finalOpacity);
  }

  // Jatos relativísticos bipolares ao longo do eixo de rotação (eixo Y).
  // Emissão síncrotron colimada com beaming relativístico: o jato que se
  // aproxima do observador é amplificado por ~D^3, o que se afasta é suprimido.
  vec3 jetEmission(vec3 pos, vec3 rayDir, float time) {
    float absY = abs(pos.y);
    float launchY = uDiskInnerRadius * 0.35;
    if (absY < launchY || absY > uJetLength) return vec3(0.0);

    // Cone estreito: raio cresce lentamente com a distância (colimação)
    float rho = length(pos.xz);
    float jetRadius = uJetBaseRadius + absY * uJetOpeningAngle;
    float radial = 1.0 - smoothstep(0.0, jetRadius, rho);
    if (radial <= 0.001) return vec3(0.0);

    // Decaimento de brilho ao longo do jato
    float axialNorm = clamp((absY - launchY) / (uJetLength - launchY), 0.0, 1.0);
    float axial = pow(1.0 - axialNorm, 1.6);

    // Nós de plasma (estrutura em "knots") fluindo para fora
    float flow = absY * 0.9 - time * uJetSpeed;
    float twist = atan(pos.z, pos.x) * 1.5;
    vec3 noisePos = vec3(pos.x * 2.2, flow + twist * 0.15, pos.z * 2.2);
    float knots = fbm(noisePos, 2.2, 0.55);
    float density = radial * radial * axial * (0.35 + 0.85 * knots);

    // Beaming relativístico (aproximação: fator Doppler D = 1/(1 - B.cosT))
    vec3 jetDir = vec3(0.0, sign(pos.y), 0.0);
    float cosT = dot(jetDir, -rayDir);
    float doppler = 1.0 / max(1.0 - uJetBeta * cosT, 0.15);
    float boost = pow(clamp(doppler, 0.15, 5.0), uBeamingStrength);

    // Núcleo mais quente (branco-azulado) envolto por bainha azul-violeta
    float coreMix = 1.0 - smoothstep(0.0, jetRadius * 0.45, rho);
    vec3 jetCol = mix(uJetColor, uJetCoreColor, coreMix);

    return jetCol * density * uJetBrightness * boost;
  }

  // Corona quente de raios-X: plasma difuso brilhante ao redor do motor central
  vec3 coronaEmission(vec3 pos, float rs) {
    float r = length(pos);
    float glow = exp(-(r - rs) * 0.55);
    return uCoronaColor * glow * uCoronaBrightness;
  }

  void main() {
    float rs = uBlackHoleMass * 2.0;
    vec2 uv = (gl_FragCoord.xy / uResolution - 0.5) * 2.0;
    float aspect = uResolution.x / uResolution.y;
    vec2 screenPos = vec2(uv.x * aspect, uv.y);

    vec3 camPos = uCameraPosition;
    vec3 camTarget = uCameraTarget;
    vec3 camForward = normalize(camTarget - camPos);
    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    vec3 camRight = normalize(cross(worldUp, camForward));
    vec3 camUp = cross(camForward, camRight);

    float fov = 1.0;
    vec3 rayDir = normalize(camForward * fov + camRight * screenPos.x + camUp * screenPos.y);

    vec3 rayPos = camPos;
    vec3 prevPos = camPos;
    vec3 color = vec3(0.0);
    float alpha = 0.0;
    float escaped = 0.0;
    float captured = 0.0;
    float innerR = uDiskInnerRadius;
    float outerR = uDiskOuterRadius;

    for (int i = 0; i < 48; i++) {
      if (escaped > 0.5 || captured > 0.5 || alpha > 0.99) break;

      float r = length(rayPos);

      if (r < rs * 1.01) { captured = 1.0; break; }
      if (r > 100.0) { escaped = 1.0; break; }

      vec3 toCenter = -rayPos / r;
      float bendStrength = rs / (r * r) * uStepSize * uGravitationalLensing;
      rayDir += toCenter * bendStrength;
      rayDir = normalize(rayDir);

      prevPos = rayPos;
      rayPos += rayDir * uStepSize;

      // Emissão volumétrica dos jatos e da corona acumulada ao longo do raio
      float remaining = 1.0 - alpha;
      color += jetEmission(rayPos, rayDir, uTime) * uStepSize * remaining;
      color += coronaEmission(rayPos, rs) * uStepSize * remaining;

      bool crossedPlane = (prevPos.y * rayPos.y) < 0.0;
      if (crossedPlane && alpha < 0.99) {
        float t = -prevPos.y / (rayPos.y - prevPos.y);
        vec3 hitPos = mix(prevPos, rayPos, t);
        float hitR = sqrt(hitPos.x * hitPos.x + hitPos.z * hitPos.z);
        bool inDisk = hitR > innerR && hitR < outerR;
        if (inDisk) {
          float hitAngle = atan(hitPos.z, hitPos.x);
          vec4 diskResult = accretionDiskColor(hitR, hitAngle, uTime, rayDir);
          float remainingAlpha = 1.0 - alpha;
          color += diskResult.rgb * diskResult.a * remainingAlpha;
          alpha += remainingAlpha * diskResult.a;
        }
      }
    }

    if (captured < 0.5) {
      escaped = 1.0;
    }

    if (escaped > 0.5 && alpha < 0.99) {
      vec3 bgColor = uStarBackgroundColor;
      if (uStarsEnabled > 0.5) bgColor += starField(rayDir);
      if (uNebulaEnabled > 0.5) bgColor += nebulaField(rayDir);
      color += bgColor * (1.0 - alpha);
    }

    vec3 finalColor = pow(max(color, vec3(0.0)), vec3(1.0 / 2.2));
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

@Component({
  selector: 'app-quasar',
  templateUrl: './quasar.component.html',
  styleUrls: ['./quasar.component.scss']
})
export class QuasarComponent implements AfterViewInit, OnDestroy {
  @ViewChild('quasarCanvas', { static: false }) quasarCanvas!: ElementRef<HTMLCanvasElement>;

  loading = true;
  soundEnabled = false;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private controls!: OrbitControls;
  private animationId!: number;
  private lastFrameTime = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uniforms!: { [key: string]: any };

  // Síntese sonora procedural (drone energético + "sopro" dos jatos,
  // inspirado nas sonificações de AGNs da NASA)
  private audioContext?: AudioContext;
  private masterGain?: GainNode;
  private oscillators: OscillatorNode[] = [];
  private lfo?: OscillatorNode;
  private noiseSource?: AudioBufferSourceNode;
  private jetNoiseSource?: AudioBufferSourceNode;
  private soundActive = false;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.initScene();
    this.animate();
    this.loading = false;
  }

  ngOnDestroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    this.controls?.dispose();
    this.scene?.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        obj.material.dispose();
      }
    });
    this.renderer?.dispose();
    this.stopQuasarSound();
    this.audioContext?.close();
  }

  onSoundToggle(): void {
    if (this.soundEnabled) {
      this.startQuasarSound();
    } else {
      this.stopQuasarSound();
    }
  }

  private startQuasarSound(): void {
    if (this.soundActive) return;

    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    this.soundActive = true;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.32, now + 2);
    masterGain.connect(ctx.destination);
    this.masterGain = masterGain;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 340;
    filter.Q.value = 0.8;
    filter.connect(masterGain);

    // Drone mais energético que o do buraco negro: o quasar é um motor
    // luminoso, então adicionamos um harmônico agudo levemente desafinado
    [55, 110, 164.8, 82.4].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (i % 2 === 0 ? 1 : -1) * 6;
      const oscGain = ctx.createGain();
      oscGain.gain.value = i === 0 ? 0.5 : 0.18;
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();
      this.oscillators.push(osc);
    });

    // Textura grave de ruído marrom (turbulência do disco)
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.createNoiseBuffer(ctx);
    noiseSource.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.4;
    noiseSource.connect(noiseGain);
    noiseGain.connect(filter);
    noiseSource.start();
    this.noiseSource = noiseSource;

    // "Sopro" agudo dos jatos relativísticos: ruído filtrado em banda alta
    const jetNoise = ctx.createBufferSource();
    jetNoise.buffer = this.createNoiseBuffer(ctx);
    jetNoise.loop = true;
    const jetFilter = ctx.createBiquadFilter();
    jetFilter.type = 'bandpass';
    jetFilter.frequency.value = 1400;
    jetFilter.Q.value = 1.4;
    const jetGain = ctx.createGain();
    jetGain.gain.value = 0.06;
    jetNoise.connect(jetFilter);
    jetFilter.connect(jetGain);
    jetGain.connect(masterGain);
    jetNoise.start();
    this.jetNoiseSource = jetNoise;

    // LFO um pouco mais rápido: pulsação do motor central
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 110;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.lfo = lfo;
  }

  private stopQuasarSound(): void {
    if (!this.soundActive || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + 1);
    }

    const nodesToStop = [...this.oscillators, this.lfo, this.noiseSource, this.jetNoiseSource]
      .filter(Boolean) as (OscillatorNode | AudioBufferSourceNode)[];
    const masterGain = this.masterGain;
    window.setTimeout(() => {
      nodesToStop.forEach((node) => {
        try {
          node.stop();
          node.disconnect();
        } catch {
          // already stopped
        }
      });
      masterGain?.disconnect();
    }, 1100);

    this.oscillators = [];
    this.lfo = undefined;
    this.noiseSource = undefined;
    this.jetNoiseSource = undefined;
    this.masterGain = undefined;
    this.soundActive = false;
  }

  private createNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    return buffer;
  }

  private initScene(): void {
    const canvas = this.quasarCanvas.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 7, -22);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = -0.5;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 50;

    const pixelRatio = this.renderer.getPixelRatio();
    this.uniforms = {
      uBlackHoleMass: { value: 0.45 },
      uDiskInnerRadius: { value: 3.6 },
      uDiskOuterRadius: { value: 13.5 },
      // Disco muito mais quente que o de um buraco negro estelar: emissão azul/UV
      uDiskTemperature: { value: 30.0 },
      uTemperatureFalloff: { value: 0.75 },
      uDiskBrightness: { value: 6 },
      uDiskRotationSpeed: { value: -10.5 },
      uTurbulenceScale: { value: 1.7 },
      uTurbulenceStretch: { value: 0.72 },
      uTurbulenceSharpness: { value: 6.2 },
      uTurbulenceCycleTime: { value: 5 },
      uTurbulenceLacunarity: { value: 2.5 },
      uTurbulencePersistence: { value: 0.8 },
      uDiskEdgeSoftnessInner: { value: 0.16 },
      uDiskEdgeSoftnessOuter: { value: 0.5 },
      uGravitationalLensing: { value: 2.2 },
      uDopplerStrength: { value: 1.1 },
      uStepSize: { value: 1 },
      // Jatos relativísticos
      uJetLength: { value: 26 },
      uJetBaseRadius: { value: 0.55 },
      uJetOpeningAngle: { value: 0.055 },
      uJetBrightness: { value: 1.35 },
      uJetSpeed: { value: 6.5 },
      uJetBeta: { value: 0.85 },
      uBeamingStrength: { value: 1.4 },
      uJetColor: { value: new THREE.Color(0x4f7dff) },
      uJetCoreColor: { value: new THREE.Color(0xd9e8ff) },
      // Corona de raios-X
      uCoronaBrightness: { value: 0.35 },
      uCoronaColor: { value: new THREE.Color(0x9db8ff) },
      uStarsEnabled: { value: 1 },
      uStarBackgroundColor: { value: new THREE.Color(0x000000) },
      uStarDensity: { value: 0.1 },
      uStarSize: { value: 1.2 },
      uStarBrightness: { value: 0.1 },
      uNebulaEnabled: { value: 1 },
      uNebula1Scale: { value: 2 },
      uNebula1Density: { value: 0.5 },
      uNebula1Brightness: { value: 0.012 },
      uNebula1Color: { value: new THREE.Color(0x1a0f3a) },
      uNebula2Scale: { value: 5.5 },
      uNebula2Density: { value: 0.05 },
      uNebula2Brightness: { value: 0.2 },
      uNebula2Color: { value: new THREE.Color(0x02040f) },
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width * pixelRatio, height * pixelRatio) },
      uCameraPosition: { value: new THREE.Vector3().copy(this.camera.position) },
      uCameraTarget: { value: new THREE.Vector3(0, 0, 0) }
    };

    const geometry = new THREE.SphereGeometry(100, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      side: THREE.BackSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    this.scene.add(mesh);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.8, 0, 0.4);
    this.composer.addPass(bloomPass);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    const canvas = this.quasarCanvas.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);

    const pixelRatio = this.renderer.getPixelRatio();
    this.uniforms['uResolution'].value.set(width * pixelRatio, height * pixelRatio);
  };

  private animate(): void {
    this.lastFrameTime = performance.now();
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.animationId = requestAnimationFrame(loop);

        const now = performance.now();
        const delta = Math.min((now - this.lastFrameTime) / 1000, 0.033);
        this.lastFrameTime = now;

        this.controls.update();
        this.uniforms['uTime'].value += delta;
        this.updateCameraUniforms();

        this.composer.render();
      };
      loop();
    });
  }

  private updateCameraUniforms(): void {
    this.uniforms['uCameraPosition'].value.copy(this.camera.position);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const target = this.camera.position.clone().add(forward.multiplyScalar(10));
    this.uniforms['uCameraTarget'].value.copy(target);
  }
}
