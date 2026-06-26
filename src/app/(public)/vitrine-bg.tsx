"use client";

import { Warp } from "@paper-design/shaders-react";

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
      <Warp
        style={{ height: "100%", width: "100%" }}
        proportion={0.45}
        softness={1}
        distortion={0.08}
        swirl={0.6}
        swirlIterations={8}
        shape="checks"
        shapeScale={0.12}
        scale={1}
        rotation={0}
        speed={0.3}
        colors={["#F7F4EE", "#EDE0C0", "#F5EDDA", "#E8D9B8"]}
      />
    </div>
  );
}
