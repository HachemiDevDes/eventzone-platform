import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type, Authorization",
    },
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Only HTTP/HTTPS URLs can be proxied" }, { status: 400 });
    }

    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Eventzone-Image-Proxy/1.0",
      },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream fetch failed with status ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const contentType = upstream.headers.get("content-type") || "image/png";
    const cacheControl = upstream.headers.get("cache-control") || "public, max-age=31536000, immutable";
    const arrayBuffer = await upstream.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Cache-Control": cacheControl,
      },
    });
  } catch (err) {
    console.error("Storage proxy route error:", err);
    return NextResponse.json({ error: err.message || "Failed to proxy image" }, { status: 500 });
  }
}
