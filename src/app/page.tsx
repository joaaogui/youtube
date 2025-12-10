"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VideosTable } from "@/components/videos-table";
import { searchChannel, fetchChannelVideos, CHANNEL_PREFIX, clearCache } from "@/lib/youtube";
import { Search, Youtube, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [channelToSearch, setChannelToSearch] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const queryClient = useQueryClient();

  const {
    data: channelInfo,
    isLoading: isLoadingChannel,
    error: channelError,
  } = useQuery({
    queryKey: ["channel", channelToSearch],
    queryFn: () => searchChannel(channelToSearch!),
    enabled: !!channelToSearch,
    staleTime: Infinity,
  });

  const {
    data: videos,
    isLoading: isLoadingVideos,
    isFetching: isFetchingVideos,
  } = useQuery({
    queryKey: ["videos", channelInfo?.channelId],
    queryFn: () =>
      fetchChannelVideos(channelInfo!.channelId, (current, total) => {
        setProgress({ current, total });
      }),
    enabled: !!channelInfo?.channelId,
    staleTime: Infinity,
  });

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      setProgress({ current: 0, total: 0 });
      setChannelToSearch(searchQuery.trim());
    }
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const isLoading = isLoadingChannel || isLoadingVideos || isFetchingVideos;
  const hasVideos = videos && videos.length > 0;

  const handleRefresh = useCallback(() => {
    if (channelInfo?.channelId) {
      clearCache(channelInfo.channelId);
      queryClient.invalidateQueries({ queryKey: ["videos", channelInfo.channelId] });
      setProgress({ current: 0, total: 0 });
    }
  }, [channelInfo?.channelId, queryClient]);

  // Render the initial search page (no videos yet)
  if (!hasVideos && !isLoading && !channelError) {
    return (
      <main className="min-h-screen flex flex-col">
        {/* Centered content */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-xl space-y-8 text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <Youtube className="h-32 w-32 text-primary" />
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-red-500 to-orange-500 bg-clip-text text-transparent">YouTube Analyzer</span>
              </h1>
              <p className="text-muted-foreground">
                Analyze channel statistics and video performance
              </p>
            </div>

            {/* Search */}
            <div className="flex justify-center">
              <div className="flex gap-2 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for a YouTube channel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                  className="h-12 px-6"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Hints */}
            <div className="text-sm text-muted-foreground">
              <p>
                Try searching for{" "}
                {["MrBeast", "Veritasium", "Marques Brownlee"].map((suggestion, index, arr) => (
                  <span key={suggestion}>
                    <button
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setChannelToSearch(suggestion);
                      }}
                      className="text-foreground font-medium hover:text-primary transition-colors"
                    >
                      {suggestion}
                    </button>
                    {index < arr.length - 1 && (index === arr.length - 2 ? ", or " : ", ")}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/50">
          <p>
            Powered by{" "}
            <a
              href="https://developers.google.com/youtube/v3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              YouTube Data API
            </a>
          </p>
        </footer>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="max-w-full px-4 py-4 w-full mx-auto">
        {/* Header Section */}
        <div className="flex flex-row items-center gap-4 mb-6">
          {/* Logo */}
          <div className="w-12 flex-shrink-0">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Youtube className="h-10 w-10 text-primary" />
            </Link>
          </div>

          {/* Search Input */}
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a YouTube channel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="h-12 px-6"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </div>

        {/* Error State */}
        {channelError && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-4">
              <p className="text-destructive text-center">
                Error searching for channel. Please check the name and try again.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <Card>
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

            {progress.total > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Loading videos...</span>
                      <span className="font-medium">{progress.current} / {progress.total}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        )}

        {/* Channel Info */}
        {channelInfo && !isLoading && (
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
                    {videos && (
                      <p className="text-muted-foreground">
                        {videos.length} videos found
                      </p>
                    )}
                  </div>
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  title="Refresh data (clear cache)"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Videos Table */}
        {hasVideos && <VideosTable data={videos} />}
      </div>
    </main>
  );
}

