import { NextResponse } from "next/server";
import { submitToIndexNow } from "../../../../lib/indexnow";
import { fetchPublicEvents } from "../../../../lib/db";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    let urlsToSubmit = [];

    if (Array.isArray(body.urls) && body.urls.length > 0) {
      urlsToSubmit = body.urls;
    } else if (body.eventSlug) {
      urlsToSubmit = [
        `/${body.eventSlug}`,
        "/",
        "/sitemap.xml"
      ];
    } else if (body.all === true) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventzone.pro";
      const events = await fetchPublicEvents().catch(() => []);
      const eventUrls = events.map(e => `${baseUrl}/${e.slug || e.id}`);
      urlsToSubmit = [
        baseUrl,
        `${baseUrl}/sitemap.xml`,
        `${baseUrl}/checkin`,
        ...eventUrls
      ];
    } else {
      urlsToSubmit = ["/", "/sitemap.xml"];
    }

    const result = await submitToIndexNow(urlsToSubmit);

    return NextResponse.json({
      ok: result.success,
      status: result.status,
      submittedUrls: result.urls || urlsToSubmit,
      details: result
    });
  } catch (err) {
    return NextResponse.json(
      { error: "IndexNow submission failed", message: err?.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Eventzone IndexNow Endpoint",
    usage: "POST with { urls: string[] } or { eventSlug: string } or { all: true }",
    endpoint: "https://api.indexnow.org/indexnow"
  });
}
