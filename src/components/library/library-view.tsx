"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookGrid } from "./book-grid";
import { BookTable } from "./book-table";
import { EmptyState } from "./empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid, List, Plus, Download, Search, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  initialFilters: { categoryId?: string; tag?: string; q?: string };
  categories: Category[];
}

export function LibraryView({ initialFilters, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [view, setView] = useState<"grid" | "table">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("libraryView") as "grid" | "table") ?? "grid";
    }
    return "grid";
  });

  // Tab is URL-driven so bottom nav links work
  const tab = searchParams.get("tab") === "wishlist" ? "wishlist" : "library";

  const [books, setBooks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialFilters.q ?? "");
  const [exporting, setExporting] = useState(false);

  const categoryId = searchParams.get("categoryId") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const q = searchParams.get("q") ?? "";

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId) params.set("categoryId", categoryId);
    if (tag) params.set("tag", tag);
    if (q) params.set("q", q);
    if (tab === "wishlist") {
      params.set("purchaseStatus", "wishlist");
    } else {
      params.set("excludeStatus", "wishlist");
    }

    const res = await fetch(`/api/books?${params}`);
    if (res.ok) {
      const data = await res.json();
      setBooks(data.books);
      setTotal(data.total);
    }
    setLoading(false);
  }, [categoryId, tag, q, tab]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const updateSearch = (val: string) => {
    setSearch(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set("q", val); else params.delete("q");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const toggleView = (v: "grid" | "table") => {
    setView(v);
    localStorage.setItem("libraryView", v);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/books/export");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "libreria.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Errore durante l'esportazione");
    } finally {
      setExporting(false);
    }
  };

  const activeCategoryName = categoryId
    ? categories.find((c) => c.id === categoryId)?.name
    : null;

  const isWishlist = tab === "wishlist";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            {isWishlist ? "Lista dei desideri" : "La mia libreria"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} {total === 1 ? "libro" : "libri"}
            {activeCategoryName ? ` · ${activeCategoryName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="hidden sm:flex"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Esporta CSV
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden sm:flex">
            <Link href="/library/bulk-upload">
              <Plus className="w-4 h-4 mr-1.5" />
              Multiplo
            </Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:flex">
            <Link href="/library/upload">
              <Plus className="w-4 h-4 mr-1.5" />
              Aggiungi libro
            </Link>
          </Button>
        </div>
      </div>

      {/* Search + view toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cerca titolo, autore, tag, luogo..."
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            className="pl-9 h-11 text-base sm:text-sm sm:h-10"
          />
          {search && (
            <button
              onClick={() => updateSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center border border-border rounded-lg overflow-hidden shrink-0">
          <button
            onClick={() => toggleView("grid")}
            className={`p-2.5 transition-colors ${view === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleView("table")}
            className={`p-2.5 transition-colors ${view === "table" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active filters */}
      {(activeCategoryName || tag) && (
        <div className="flex flex-wrap gap-2">
          {activeCategoryName && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent text-primary border border-primary/20">
              {activeCategoryName}
              <button onClick={() => clearFilter("categoryId")} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {tag && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
              #{tag}
              <button onClick={() => clearFilter("tag")} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className={view === "grid"
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
          : "space-y-2"
        }>
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className={view === "grid" ? "aspect-[2/3] rounded-xl" : "h-14 rounded-lg"}
            />
          ))}
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          message={q || tag || categoryId ? "Nessun libro trovato" : undefined}
          showCta={!q && !tag && !categoryId}
        />
      ) : view === "grid" ? (
        <BookGrid books={books} />
      ) : (
        <BookTable books={books} categories={categories} />
      )}
    </div>
  );
}
