import { ImageResponse } from "next/og";

export const size = {
  width: 1024,
  height: 1024
};

export const contentType = "image/png";

function AppleIconArtwork() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 28% 18%, rgba(255,255,255,0.3), transparent 32%), linear-gradient(180deg, #59a8ff 0%, #2f79f7 48%, #1d62e8 100%)"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0.08) 100%)"
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 44,
          top: 44,
          width: 936,
          height: 936,
          borderRadius: 220,
          background: "rgba(255,255,255,0.98)",
          boxShadow:
            "0 26px 54px rgba(18, 53, 130, 0.18), inset 0 -14px 24px rgba(79, 128, 226, 0.12)"
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 72,
          width: 880,
          height: 214,
          borderTopLeftRadius: 170,
          borderTopRightRadius: 170,
          background: "linear-gradient(180deg, #56a1ff 0%, #2d77f5 100%)",
          boxShadow: "inset 0 -8px 18px rgba(0,0,0,0.08)"
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 144,
          left: 146,
          width: 52,
          height: 52,
          borderRadius: 999,
          background: "#ffffff"
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 144,
          left: 230,
          width: 52,
          height: 52,
          borderRadius: 999,
          background: "#ffffff"
        }}
      />
      <svg
        width="700"
        height="560"
        viewBox="0 0 620 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          top: 250,
          left: 162
        }}
      >
        <path d="M36 416H468" stroke="#2D77F5" strokeWidth="28" strokeLinecap="round" />
        <path d="M46 346L154 238L246 306L390 160L438 191L522 108" stroke="#2D77F5" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M124 176V70" stroke="#2D77F5" strokeWidth="34" strokeLinecap="round" />
        <path d="M82 112L124 70L166 112" stroke="#2D77F5" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M430 230V336" stroke="#2D77F5" strokeWidth="34" strokeLinecap="round" />
        <path d="M388 294L430 336L472 294" stroke="#2D77F5" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function AppleIcon() {
  return new ImageResponse(<AppleIconArtwork />, size);
}
