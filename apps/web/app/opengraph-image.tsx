import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Duelboard";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(120deg, #020617 0%, #0f172a 50%, #115e59 100%)",
          color: "#a5f3fc",
          fontSize: 72,
          letterSpacing: 8,
          textTransform: "uppercase",
          border: "12px solid rgba(34,211,238,0.55)",
        }}
      >
        Duelboard
      </div>
    ),
    {
      ...size,
    },
  );
}
