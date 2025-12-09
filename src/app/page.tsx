"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VideosTable } from "@/components/videos-table";
import { searchChannel, fetchChannelVideos, CHANNEL_PREFIX } from "@/lib/youtube";
import type { ChannelInfo } from "@/types/youtube";
import { Search, Youtube, Loader2, ExternalLink } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [channelToSearch, setChannelToSearch] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className={`mx-auto transition-all duration-500 ${hasVideos ? "max-w-full px-4 py-4" : "max-w-2xl px-4 py-20"}`}>
        {/* Header Section */}
        <div className={`flex transition-all duration-500 ${hasVideos ? "flex-row items-center gap-4 mb-6" : "flex-col items-center gap-8"}`}>
          {/* Logo */}
          <div className={`transition-all duration-500 ${hasVideos ? "w-12 flex-shrink-0" : "w-full max-w-md"}`}>
            {hasVideos ? (
              <Youtube className="h-10 w-10 text-primary" />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Youtube className="h-24 w-24 text-primary animate-pulse" />
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-red-500 to-orange-500 bg-clip-text text-transparent">
                  YouTube Analyzer
                </h1>
                <p className="text-muted-foreground text-center">
                  Analise estatísticas de canais e vídeos do YouTube
                </p>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className={`flex gap-2 transition-all duration-500 ${hasVideos ? "flex-1" : "w-full"}`}>
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
                "Buscar"
              )}
            </Button>
          </div>
        </div>

        {/* Error State */}
        {channelError && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-4">
              <p className="text-destructive text-center">
                Erro ao buscar canal. Verifique o nome e tente novamente.
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
                      <span className="text-muted-foreground">Carregando vídeos...</span>
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
              <a
                href={`${CHANNEL_PREFIX}${channelInfo.channelId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 group"
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
                      {videos.length} vídeos encontrados
                    </p>
                  )}
                </div>
              </a>
            </CardContent>
          </Card>
        )}

        {/* Videos Table */}
        {hasVideos && <VideosTable data={videos} />}
      </div>
    </main>
  );
}

