"use client";

import { useState, useTransition, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchChannelProps {
  initialValue?: string;
  compact?: boolean;
}

export function SearchChannel({ initialValue = "", compact = false }: SearchChannelProps) {
  const [query, setQuery] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSearch = (e?: FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    startTransition(() => {
      router.push(`/channel/${encodeURIComponent(query.trim())}`);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`flex gap-2 w-full ${compact ? "max-w-md" : "max-w-xl"}`}
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for a YouTube channel..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          className={`pl-10 ${
            compact ? "h-9 text-sm" : "h-12 text-base"
          } bg-card/50 border-border/50 focus:border-primary focus:ring-primary/20`}
        />
      </div>
      <Button
        type="submit"
        disabled={isPending || !query.trim()}
        className={`${
          compact ? "h-9 px-4" : "h-12 px-6"
        } font-semibold`}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Search"
        )}
      </Button>
    </form>
  );
}

