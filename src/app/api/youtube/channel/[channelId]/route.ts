import { NextResponse } from "next/server";
import { fetchChannelVideos } from "@/lib/youtube-server";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { validateChannelId, getSafeErrorMessage } from "@/lib/validation";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    // Rate limiting (stricter for this expensive endpoint)
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(
      `yt-channel:${clientIp}`,
      RATE_LIMITS.channel
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Retry-After": String(rateLimitResult.retryAfter || 60),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimitResult.resetTime),
          },
        }
      );
    }

    const { channelId } = await params;

    // Input validation
    const validation = validateChannelId(channelId);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400, headers: corsHeaders }
      );
    }

    const videos = await fetchChannelVideos(validation.sanitized!);

    return NextResponse.json(videos, {
      headers: {
        ...corsHeaders,
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        "X-RateLimit-Reset": String(rateLimitResult.resetTime),
        // Cache channel videos for 6 hours (data is also cached client-side)
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Fetch videos error:", error);
    return NextResponse.json(
      {
        error: getSafeErrorMessage(error, "Failed to fetch channel videos"),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
