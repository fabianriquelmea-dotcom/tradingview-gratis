"use client";

import { Watchlist } from "@/components/watchlist/Watchlist";
import { ScalpingPanel } from "@/components/scalping/ScalpingPanel";

export function RightSidebar() {
  return (
    <aside className="flex w-64 flex-col border-l border-tv-border bg-tv-panel">
      <ScalpingPanel />
      <Watchlist />
    </aside>
  );
}
