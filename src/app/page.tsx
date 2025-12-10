import Link from "next/link";
import { Youtube } from "lucide-react";
import { SearchChannel } from "@/components/search-channel";

const SUGGESTIONS = ["MrBeast", "Veritasium", "Marques Brownlee"];

export default function HomePage() {
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
            <SearchChannel />
          </div>

          {/* Hints */}
          <div className="text-sm text-muted-foreground">
            <p>
              Try searching for{" "}
              {SUGGESTIONS.map((suggestion, index) => (
                <span key={suggestion}>
                  <Link
                    href={`/channel/${encodeURIComponent(suggestion)}`}
                    className="text-foreground font-medium hover:text-primary transition-colors"
                  >
                    {suggestion}
                  </Link>
                  {index < SUGGESTIONS.length - 1 && (index === SUGGESTIONS.length - 2 ? ", or " : ", ")}
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
