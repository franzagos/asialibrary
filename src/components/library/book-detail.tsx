"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { BookForm } from "./book-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Pencil, Trash2, Search, Loader2, ExternalLink, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Book {
  id: string;
  title: string;
  author?: string | null;
  year?: string | null;
  edition?: string | null;
  descriptionIt?: string | null;
  descriptionEn?: string | null;
  descriptionRu?: string | null;
  marketPrice?: string | null;
  coverUrl?: string | null;
  personalNotes?: string | null;
  purchaseStatus?: string | null;
  purchaseLocation?: string | null;
  categoryId?: string | null;
  tags: string[];
  createdAt: Date | string;
}

const STATUS_LABELS: Record<string, string> = {
  owned: "Posseduto",
  wishlist: "Lista dei desideri",
  lent: "Prestato",
  sold: "Venduto",
};

export function BookDetail({ book, categories }: { book: Book; categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentBook, setCurrentBook] = useState(book);
  const [searchingPrice, setSearchingPrice] = useState(false);
  const [priceSources, setPriceSources] = useState<{ url: string; title?: string }[]>([]);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const categoryName = currentBook.categoryId
    ? categories.find((c) => c.id === currentBook.categoryId)?.name
    : null;

  const handleSave = async (formData: FormData) => {
    const res = await fetch(`/api/books/${currentBook.id}`, {
      method: "PATCH",
      body: formData,
    });
    if (!res.ok) {
      toast.error("Errore durante il salvataggio");
      return;
    }
    const updated = await res.json();
    setCurrentBook({ ...updated, tags: updated.tags ?? [] });
    setEditing(false);
    toast.success("Libro aggiornato");
  };

  const handleSearchPrice = async () => {
    setSearchingPrice(true);
    try {
      const res = await fetch("/api/books/price-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: currentBook.title, author: currentBook.author }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.marketPrice != null) {
        const updated = await fetch(`/api/books/${currentBook.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marketPrice: String(data.marketPrice) }),
        });
        if (updated.ok) {
          const u = await updated.json();
          setCurrentBook({ ...currentBook, marketPrice: u.marketPrice });
          setPriceSources(data.sources ?? []);
          setSourcesOpen(false);
          toast.success(`Prezzo aggiornato: €${data.marketPrice}`);
        }
      } else {
        toast.info("Prezzo non trovato online");
      }
    } catch {
      toast.error("Errore nella ricerca del prezzo");
    } finally {
      setSearchingPrice(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/books/${currentBook.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Errore durante l'eliminazione");
      setDeleting(false);
      return;
    }
    toast.success("Libro eliminato");
    router.push("/library");
  };

  if (editing) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <button
          onClick={() => setEditing(false)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Annulla
        </button>
        <h1 className="text-xl font-semibold mb-6">Modifica libro</h1>
        <BookForm
          initialData={currentBook}
          categories={categories}
          onSubmit={handleSave}
          submitLabel="Salva modifiche"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/library"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Libreria
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Modifica</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Elimina</span>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Cover */}
        <div className="md:col-span-1">
          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted border border-border">
            {currentBook.coverUrl ? (
              <Image
                src={currentBook.coverUrl}
                alt={currentBook.title}
                width={300}
                height={450}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#F5F0EE" }}>
                <span className="text-5xl">📚</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="md:col-span-2 space-y-5">
          <div>
            <h1 className="text-2xl font-semibold leading-tight">{currentBook.title}</h1>
            {currentBook.author && (
              <p className="text-lg text-muted-foreground mt-1">{currentBook.author}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {categoryName && (
              <Badge variant="secondary">{categoryName}</Badge>
            )}
            {currentBook.purchaseStatus && (
              <Badge variant="outline">{STATUS_LABELS[currentBook.purchaseStatus] ?? currentBook.purchaseStatus}</Badge>
            )}
          </div>

          {currentBook.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {currentBook.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border border-border">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {currentBook.year && (
              <>
                <dt className="text-muted-foreground">Anno</dt>
                <dd className="font-medium">{currentBook.year}</dd>
              </>
            )}
            {currentBook.edition && (
              <>
                <dt className="text-muted-foreground">Edizione</dt>
                <dd className="font-medium">{currentBook.edition}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Prezzo mercato</dt>
            <dd className="font-medium flex items-center gap-2 flex-wrap">
              {currentBook.marketPrice ? (
                <span style={{ color: "var(--terracotta)" }}>
                  €{parseFloat(currentBook.marketPrice).toFixed(2)}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              <button
                onClick={handleSearchPrice}
                disabled={searchingPrice}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-0.5 transition-colors"
              >
                {searchingPrice ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                Cerca
              </button>
              {priceSources.length > 0 && (
                <button
                  onClick={() => setSourcesOpen((o) => !o)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-0.5 transition-colors"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${sourcesOpen ? "rotate-180" : ""}`} />
                  Fonti ({priceSources.length})
                </button>
              )}
            </dd>
            {currentBook.purchaseLocation && (
              <>
                <dt className="text-muted-foreground">Luogo acquisto</dt>
                <dd className="font-medium">{currentBook.purchaseLocation}</dd>
              </>
            )}
          </dl>

          {sourcesOpen && priceSources.length > 0 && (
            <ul className="space-y-1 pl-1 border-l-2 border-border -mt-2">
              {priceSources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline break-all"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {s.title ?? (() => { try { return new URL(s.url).hostname; } catch { return s.url; } })()}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {(currentBook.descriptionIt || currentBook.descriptionEn || currentBook.descriptionRu) && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Descrizione</p>
              <Tabs defaultValue={currentBook.descriptionIt ? "it" : currentBook.descriptionEn ? "en" : "ru"}>
                <TabsList className="mb-2">
                  {currentBook.descriptionIt && <TabsTrigger value="it">🇮🇹 IT</TabsTrigger>}
                  {currentBook.descriptionEn && <TabsTrigger value="en">🇬🇧 EN</TabsTrigger>}
                  {currentBook.descriptionRu && <TabsTrigger value="ru">🇷🇺 RU</TabsTrigger>}
                </TabsList>
                {currentBook.descriptionIt && (
                  <TabsContent value="it"><p className="text-sm leading-relaxed">{currentBook.descriptionIt}</p></TabsContent>
                )}
                {currentBook.descriptionEn && (
                  <TabsContent value="en"><p className="text-sm leading-relaxed">{currentBook.descriptionEn}</p></TabsContent>
                )}
                {currentBook.descriptionRu && (
                  <TabsContent value="ru"><p className="text-sm leading-relaxed">{currentBook.descriptionRu}</p></TabsContent>
                )}
              </Tabs>
            </div>
          )}

          {currentBook.personalNotes && (
            <div className="p-4 rounded-xl border border-border bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Note personali</p>
              <p className="text-sm leading-relaxed">{currentBook.personalNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina libro</DialogTitle>
            <DialogDescription>
              Sei sicura di voler eliminare &quot;{currentBook.title}&quot;? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
