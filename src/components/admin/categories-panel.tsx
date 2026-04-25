"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function CategoriesPanel({ categories: initial }: { categories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initial);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      toast.success(`Categoria "${created.name}" aggiunta`);
    } catch {
      toast.error("Errore durante l'aggiunta");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    setDeletingId(cat.id);
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id }),
      });
      if (!res.ok) throw new Error();
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      toast.success(`Categoria "${cat.name}" eliminata`);
    } catch {
      toast.error("Errore durante l'eliminazione");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
      <Link
        href="/library"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Libreria
      </Link>

      <h1 className="text-xl font-semibold mb-6">Gestione categorie</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome categoria"
          className="flex-1"
        />
        <Button type="submit" disabled={adding || !name.trim()}>
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span className="ml-1.5">Aggiungi</span>
        </Button>
      </form>

      <ul className="space-y-2">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-muted/20"
          >
            <span className="text-sm font-medium">{cat.name}</span>
            <button
              onClick={() => handleDelete(cat)}
              disabled={deletingId === cat.id}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              {deletingId === cat.id
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />}
            </button>
          </li>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nessuna categoria</p>
        )}
      </ul>
    </div>
  );
}
