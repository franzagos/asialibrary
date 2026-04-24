"use client";

import { cn } from "@/lib/utils";
import { BookOpen, LayoutGrid, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  categories: Category[];
  isAdmin: boolean;
  onClose?: () => void;
}

export function LibrarySidebar({ categories, isAdmin, onClose }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCategoryId = searchParams.get("categoryId");

  const navigate = (href: string) => {
    router.push(href);
    onClose?.();
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-border">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <Link href="/library" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--terracotta)" }}>
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-foreground tracking-tight">Asia&apos;s Library</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <button
          onClick={() => navigate("/library")}
          className={cn(
            "w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
            !activeCategoryId && pathname === "/library"
              ? "text-primary bg-accent border-l-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <LayoutGrid className="w-4 h-4 shrink-0" />
          Tutti i libri
        </button>

        {categories.length > 0 && (
          <>
            <p className="px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Categorie
            </p>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/library?categoryId=${cat.id}`)}
                className={cn(
                  "w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5",
                  activeCategoryId === cat.id
                    ? "text-primary bg-accent font-medium border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {cat.name}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-border space-y-0.5">
        {isAdmin && (
          <Link
            href="/admin/invites"
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4" />
            Gestione inviti
          </Link>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Esci
        </button>
      </div>
    </div>
  );
}
