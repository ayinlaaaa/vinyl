import { ImageResponse } from "next/og";
import { getPublicRecap } from "@/app/actions/recaps";
import { formatOgNumber, recapOgPayload } from "@/lib/og-recap";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const recap = await getPublicRecap(id);
  if (!recap) {
    return new Response("Not found", { status: 404 });
  }

  const payload = recapOgPayload(recap.title, recap.data);
  if (!payload) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0a0a",
          color: "#fdfdfc",
          padding: "64px 72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-80px",
            top: "40px",
            width: "360px",
            height: "360px",
            borderRadius: "180px",
            border: "2px solid rgba(232, 184, 74, 0.25)",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "14px",
                border: "3px solid #e8b84a",
                display: "flex",
              }}
            />
            <span style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", fontWeight: 700 }}>
              Vinyl
            </span>
          </div>
          <span style={{ fontSize: 22, color: "#e8b84a", letterSpacing: 4 }}>{payload.year}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ width: 64, height: 4, backgroundColor: "#e8b84a", display: "flex" }} />
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, display: "flex", flexDirection: "column" }}>
            <span>MY YEAR IN</span>
            <span style={{ fontStyle: "italic", color: "#e8b84a" }}>HI-FI</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 56, fontWeight: 700 }}>{formatOgNumber(payload.minutes)}</span>
            <span style={{ fontSize: 16, letterSpacing: 3, textTransform: "uppercase", color: "#a1a1aa" }}>
              Minutes listened
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: 36, fontStyle: "italic", color: "#e8b84a" }}>{payload.vibe}</span>
            <span style={{ fontSize: 16, letterSpacing: 3, textTransform: "uppercase", color: "#a1a1aa" }}>
              {payload.topArtist ? `Heavy rotation: ${payload.topArtist}` : `${formatOgNumber(payload.plays)} plays`}
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
