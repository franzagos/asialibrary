"use client";

import { cn } from "@/lib/utils";
import { BookOpen, Heart, Plus, SlidersHorizontal, LogOut, Settings, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  categories: Category[];
  tags: string[];
  isAdmin: boolean;
}

export function MobileNav({ categories, tags, isAdmin }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const tab = searchParams.get("tab");
  const categoryId = searchParams.get("categoryId");
  const isLibrary = pathname === "/library" && tab !== "wishlist";
  const isWishlist = pathname === "/library" && tab === "wishlist";

  const navigate = (href: string) => {
    setMenuOpen(false);
    router.push(href);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const activeCategory = categoryId
    ? categories.find((c) => c.id === categoryId)?.name
    : null;

  return (
    <>
      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Filter/Menu sheet sliding up */}
      {menuOpen && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 md:hidden bg-background border-t border-border rounded-t-2xl shadow-xl px-4 pt-4 pb-6 space-y-1 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Filtri & Menu</p>
            <button onClick={() => setMenuOpen(false)} className="p-1 rounded-lg hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <>
              <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Categorie
              </p>
              <button
                onClick={() => navigate("/library")}
                className={cn(
                  "w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors",
                  !categoryId && isLibrary
                    ? "text-primary bg-accent font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                Tutti i libri
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/library?categoryId=${cat.id}`)}
                  className={cn(
                    "w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors",
                    categoryId === cat.id
                      ? "text-primary bg-accent font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <>
              <p className="px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tag
              </p>
              <div className="flex flex-wrap gap-2 px-2 pb-1">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => navigate(`/library?tag=${encodeURIComponent(tag)}`)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs border transition-colors",
                      searchParams.get("tag") === tag
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Admin + logout */}
          <div className="pt-3 border-t border-border space-y-1">
            {isAdmin && (
              <>
                <button
                  onClick={() => navigate("/admin/categories")}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Gestione categorie
                </button>
                <button
                  onClick={() => navigate("/admin/invites")}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Inviti
                </button>
              </>
            )}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Esci
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {activeCategory && (
          <div className="px-4 py-1.5 border-b border-border bg-accent/60">
            <p className="text-xs text-primary font-medium text-center truncate">
              Categoria: {activeCategory}
            </p>
          </div>
        )}
        <div className="flex items-center h-16">
          <NavItem
            icon={<BookOpen className="w-5 h-5" />}
            label="Libreria"
            active={isLibrary}
            onClick={() => navigate("/library")}
          />
          <NavItem
            icon={<Heart className="w-5 h-5" />}
            label="Wishlist"
            active={isWishlist}
            onClick={() => navigate("/library?tab=wishlist")}
          />
          <NavItem
            icon={
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md" style={{ backgroundColor: "var(--terracotta)" }}>
                <Plus className="w-5 h-5 text-white" />
              </div>
            }
            label=""
            active={false}
            onClick={() => navigate("/library/upload")}
            isCenter
          />
          <NavItem
            icon={<SlidersHorizontal className="w-5 h-5" />}
            label="Filtri"
            active={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          />
          <NavItem
            icon={<Settings className="w-5 h-5" />}
            label="Menu"
            active={false}
            onClick={() => setMenuOpen((o) => !o)}
          />
        </div>
      </nav>
    </>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
  isCenter = false,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  isCenter?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors",
        isCenter ? "relative -top-2" : "",
        active && !isCenter ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label && <span className={cn("text-[10px] font-medium", active ? "text-primary" : "")}>{label}</span>}
    </button>
  );
}
