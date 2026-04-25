"use client";

import { useState } from "react";
import { LibrarySidebar } from "./sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

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
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col">
        <LibrarySidebar categories={categories} tags={tags} isAdmin={isAdmin} />
      </aside>

      {/* Mobile header + sheet */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-60">
              <LibrarySidebar
                categories={categories}
                tags={tags}
                isAdmin={isAdmin}
                onClose={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-sm">Asia&apos;s Library</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
