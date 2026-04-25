"use client";

import { LibrarySidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { BookOpen } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  categories: Category[];
  tags: string[];
  isAdmin: boolean;
  children: React.ReactNode;
}

export function LibraryShell({ categories, tags, isAdmin, children }: Props) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col">
        <LibrarySidebar categories={categories} tags={tags} isAdmin={isAdmin} />
      </aside>

      {/* Content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar — minimal logo only */}
        <header className="md:hidden flex items-center px-4 h-14 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30">
          <Link href="/library" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--terracotta)" }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-sm">Asia&apos;s Library</span>
          </Link>
        </header>

        {/* Page content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav categories={categories} tags={tags} isAdmin={isAdmin} />
    </div>
  );
}
