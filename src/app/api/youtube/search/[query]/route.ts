import { NextResponse } from "next/server";
import { searchChannel } from "@/lib/youtube-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ query: string }> }
) {
  try {
    const { query } = await params;
    
    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    const channelInfo = await searchChannel(decodeURIComponent(query));
    
    return NextResponse.json(channelInfo);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search channel" },
      { status: 500 }
    );
  }
}

