import { NextResponse } from "next/server";
import { fetchChannelVideos } from "@/lib/youtube-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    
    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID parameter is required" },
        { status: 400 }
      );
    }

    const videos = await fetchChannelVideos(channelId);
    
    return NextResponse.json(videos);
  } catch (error) {
    console.error("Fetch videos error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch channel videos" },
      { status: 500 }
    );
  }
}

