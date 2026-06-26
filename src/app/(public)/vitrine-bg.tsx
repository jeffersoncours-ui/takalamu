"use client";

/* Voile animé — blobs crème floutés qui dérivent lentement sur le fond blanc */
export function VitrineBg() {
  return (
    <>
      <style>{`
        @keyframes drift1 {
          0%,100% { transform: translate(0,    0)    scale(1);    }
          30%      { transform: translate(12%,  -8%)  scale(1.12); }
          70%      { transform: translate(-8%,  14%)  scale(0.92); }
        }
        @keyframes drift2 {
          0%,100% { transform: translate(0,    0)    scale(1);    }
          40%      { transform: translate(-14%, 10%)  scale(1.08); }
          75%      { transform: translate(10%,  -12%) scale(0.95); }
        }
        @keyframes drift3 {
          0%,100% { transform: translate(0,    0)    scale(1);    }
          50%      { transform: translate(8%,   8%)   scale(1.15); }
          80%      { transform: translate(-12%, -6%)  scale(0.9);  }
        }
        @keyframes drift4 {
          0%,100% { transform: translate(0,    0)    scale(1);    }
          35%      { transform: translate(-6%,  -10%) scale(1.1);  }
          65%      { transform: translate(10%,  6%)   scale(0.95); }
        }
      `}</style>

      {/* Conteneur fixe pleine page, zéro interaction */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* Blob 1 — crème chaud — haut gauche */}
        <div style={{
          position: "absolute",
          width: "70vw", height: "70vw",
          maxWidth: 640, maxHeight: 640,
          top: "-20%", left: "-15%",
          borderRadius: "50%",
          background: "radial-gradient(circle, #E8D9B8 0%, transparent 68%)",
          opacity: 0.7,
          filter: "blur(60px)",
          animation: "drift1 22s ease-in-out infinite",
        }} />

        {/* Blob 2 — crème clair — haut droit */}
        <div style={{
          position: "absolute",
          width: "55vw", height: "55vw",
          maxWidth: 520, maxHeight: 520,
          top: "-10%", right: "-10%",
          borderRadius: "50%",
          background: "radial-gradient(circle, #F0E5C8 0%, transparent 68%)",
          opacity: 0.6,
          filter: "blur(70px)",
          animation: "drift2 18s ease-in-out infinite",
        }} />

        {/* Blob 3 — crème doré — centre bas */}
        <div style={{
          position: "absolute",
          width: "80vw", height: "80vw",
          maxWidth: 700, maxHeight: 700,
          bottom: "-30%", left: "10%",
          borderRadius: "50%",
          background: "radial-gradient(circle, #EDE0C0 0%, transparent 68%)",
          opacity: 0.55,
          filter: "blur(80px)",
          animation: "drift3 26s ease-in-out infinite",
        }} />

        {/* Blob 4 — blanc cassé — bas droit */}
        <div style={{
          position: "absolute",
          width: "50vw", height: "50vw",
          maxWidth: 460, maxHeight: 460,
          bottom: "5%", right: "-5%",
          borderRadius: "50%",
          background: "radial-gradient(circle, #F5EDDA 0%, transparent 68%)",
          opacity: 0.65,
          filter: "blur(55px)",
          animation: "drift4 20s ease-in-out infinite",
        }} />
      </div>
    </>
  );
}
