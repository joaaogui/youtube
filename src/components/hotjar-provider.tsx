"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Hotjar from "@hotjar/browser";

const HOTJAR_SITE_ID = 959517171765;
const HOTJAR_VERSION = 6;

type HotjarProviderProps = {
  children: React.ReactNode;
};

export const HotjarProvider = ({ children }: HotjarProviderProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialized = useRef(false);

  // Initialize Hotjar on mount
  useEffect(() => {
    if (!isInitialized.current) {
      Hotjar.init(HOTJAR_SITE_ID, HOTJAR_VERSION);
      isInitialized.current = true;
    }
  }, []);

  // Track SPA route changes for heatmaps
  useEffect(() => {
    if (!isInitialized.current) return;

    const url = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    Hotjar.stateChange(url);
  }, [pathname, searchParams]);

  return <>{children}</>;
};
