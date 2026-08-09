import { ImageResponse } from "next/og";

export const alt = "Bondzi — WASSCE & BECE prep, made in Ghana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fbf7ec",
          padding: 72,
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Top row: wordmark + kicker */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: "#FF6B35",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fbf7ec",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              b
            </div>
            <div style={{ fontSize: 40, color: "#141414", letterSpacing: -1 }}>
              Bondzi
            </div>
          </div>
          <div
            style={{
              fontSize: 16,
              color: "#8a7f6b",
              letterSpacing: 4,
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            Issue 01 · Ghana
          </div>
        </div>

        {/* Hairline */}
        <div
          style={{
            marginTop: 24,
            height: 1,
            width: "100%",
            backgroundColor: "#d8cda9",
          }}
        />

        {/* Headline */}
        <div style={{ marginTop: 80, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 96,
              color: "#141414",
              letterSpacing: -3,
              lineHeight: 1.02,
              fontWeight: 500,
            }}
          >
            Every past question.
          </div>
          <div
            style={{
              fontSize: 96,
              color: "#141414",
              letterSpacing: -3,
              lineHeight: 1.02,
              fontWeight: 500,
              marginTop: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <span>Every wrong answer&nbsp;</span>
            <span
              style={{
                backgroundColor: "#FFD93D",
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 2,
                paddingBottom: 6,
              }}
            >
              explained
            </span>
            <span>.</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            left: 72,
            right: 72,
            bottom: 56,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: "#4b4439",
              fontFamily: "Georgia, serif",
              maxWidth: 700,
              lineHeight: 1.35,
            }}
          >
            WASSCE &amp; BECE prep built for Ghanaian students. Free to study.
            Offline-ready.
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#FF6B35",
              fontFamily: "monospace",
              letterSpacing: 1,
            }}
          >
            bondzi.online
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
