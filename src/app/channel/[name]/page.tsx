"use client";

import { useCallback, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { VideosTable } from "@/components/videos-table";
import { SearchChannel } from "@/components/search-channel";
import { searchChannel, fetchChannelVideos, CHANNEL_PREFIX, clearCache, getCacheAge } from "@/lib/youtube";
import { Youtube, ExternalLink, RefreshCw, AlertCircle, ArrowLeft, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ChannelPage() {
  const params = useParams();
  const channelName = decodeURIComponent(params.name as string);
  const queryClient = useQueryClient();
  const [cacheAge, setCacheAge] = useState<number | null>(null);

  const {
    data: channelInfo,
    isLoading: isLoadingChannel,
    error: channelError,
  } = useQuery({
    queryKey: ["channel", channelName],
    queryFn: () => searchChannel(channelName),
    enabled: !!channelName,
    staleTime: Infinity,
    retry: false,
  });

  const {
    data: videos,
    isLoading: isLoadingVideos,
    isFetching: isFetchingVideos,
  } = useQuery({
    queryKey: ["videos", channelInfo?.channelId],
    queryFn: () => fetchChannelVideos(channelInfo!.channelId),
    enabled: !!channelInfo?.channelId,
    staleTime: Infinity,
  });

  // Update cache age when videos are loaded
  useEffect(() => {
    if (channelInfo?.channelId && videos) {
      setCacheAge(getCacheAge(channelInfo.channelId));
    }
  }, [channelInfo?.channelId, videos]);

  const handleRefresh = useCallback(() => {
    if (channelInfo?.channelId) {
      clearCache(channelInfo.channelId);
      setCacheAge(null);
      queryClient.invalidateQueries({ queryKey: ["videos", channelInfo.channelId] });
    }
  }, [channelInfo?.channelId, queryClient]);

  // Error state
  if (channelError) {
    return (
      <div className="min-h-screen">
        <header className="border-b bg-card/30 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="shrink-0 hover:opacity-80 transition-opacity">
                <Youtube className="h-10 w-10 text-primary" />
              </Link>
              <div className="flex-1">
                <SearchChannel initialValue={channelName} compact />
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Channel Not Found</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              We couldn&apos;t find a YouTube channel called &quot;{channelName}&quot;. Please try a different search.
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="shrink-0 hover:opacity-80 transition-opacity">
              <Youtube className="h-10 w-10 text-primary" />
            </Link>
            <div className="flex-1">
              <SearchChannel initialValue={channelName} compact />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Channel Loading State */}
        {isLoadingChannel && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Channel Info */}
        {channelInfo && (
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <a
                  href={`${CHANNEL_PREFIX}${channelInfo.channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 group flex-1"
                >
                  <Image
                    src={channelInfo.thumbnails.default.url}
                    alt={channelInfo.channelTitle}
                    width={64}
                    height={64}
                    className="rounded-full ring-2 ring-border group-hover:ring-primary transition-all"
                  />
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold group-hover:text-primary transition-colors flex items-center gap-2">
                      {channelInfo.channelTitle}
                      <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h2>
                    {videos ? (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{videos.length} videos found</span>
                        {cacheAge !== null && cacheAge > 0 && (
                          <span className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" />
                            Cached {cacheAge} {cacheAge === 1 ? "day" : "days"} ago
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Loading videos...</p>
                    )}
                  </div>
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoadingVideos || isFetchingVideos}
                  title="Refresh data (clear cache)"
                >
                  <RefreshCw className={`h-4 w-4 ${(isLoadingVideos || isFetchingVideos) ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Videos Loading State */}
        {channelInfo && (isLoadingVideos || isFetchingVideos) && !videos && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`skeleton-${i}`} className="h-16 w-full" />
            ))}
          </div>
        )}

        {/* Videos Table */}
        {videos && videos.length > 0 && <VideosTable data={videos} />}
      </main>
    </div>
  );
}

