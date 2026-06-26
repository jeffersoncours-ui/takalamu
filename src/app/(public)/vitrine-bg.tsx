"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Ondulation douce, presque imperceptible — juste pour que le fond soit "vivant"
const vertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    pos.y += sin(pos.x * 5.0 + time * 0.35) * 0.025 * intensity;
    pos.x += cos(pos.y * 4.0 + time * 0.25) * 0.015 * intensity;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 color1;
  uniform vec3 color2;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    // Vagues douces en crème / blanc
    float wave = sin(uv.x * 7.0 + time * 0.25) * cos(uv.y * 5.0 + time * 0.18) * 0.5 + 0.5;
    wave += sin(uv.x * 13.0 - time * 0.4) * cos(uv.y * 9.0 + time * 0.3) * 0.18;
    wave = clamp(wave, 0.0, 1.0);

    vec3 color = mix(color1, color2, wave * intensity);

    // Légère vignette sur les bords pour que le centre reste propre
    float vignette = 1.0 - smoothstep(0.3, 1.0, length(uv - 0.5) * 1.4);
    color = mix(color2, color, vignette * 0.6 + 0.4);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function ShaderPlane() {
  const mesh = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      time:      { value: 0 },
      intensity: { value: 0.55 },
      // crème #F7F4EE et blanc #FFFFFF
      color1: { value: new THREE.Color("#F7F4EE") },
      color2: { value: new THREE.Color("#FFFFFF") },
    }),
    [],
  );

  useFrame((state) => {
    if (!mesh.current) return;
    uniforms.time.value = state.clock.elapsedTime;
    // intensité qui respire très légèrement
    uniforms.intensity.value = 0.55 + Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
  });

  return (
    <mesh ref={mesh}>
      {/* Plan large pour couvrir tout le canvas */}
      <planeGeometry args={[4, 4, 24, 24]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function VitrineBg() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 1.5], fov: 60 }}
        dpr={[1, 1.5]} // cap le pixel ratio pour économiser le GPU mobile
        gl={{ antialias: false, powerPreference: "low-power" }}
      >
        <ShaderPlane />
      </Canvas>
    </div>
  );
}
