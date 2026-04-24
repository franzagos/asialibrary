"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface InitialData {
  title?: string | null;
  author?: string | null;
  year?: string | null;
  edition?: string | null;
  descriptionIt?: string | null;
  descriptionEn?: string | null;
  descriptionRu?: string | null;
  marketPrice?: string | null;
  personalNotes?: string | null;
  purchaseStatus?: string | null;
  purchaseLocation?: string | null;
  categoryId?: string | null;
  tags?: string[];
  coverUrl?: string | null;
}

interface Props {
  initialData?: InitialData;
  categories: Category[];
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel?: string;
  coverFile?: File | null;
}

const STATUS_OPTIONS = [
  { value: "owned", label: "Posseduto" },
  { value: "wishlist", label: "Lista dei desideri" },
  { value: "lent", label: "Prestato" },
  { value: "sold", label: "Venduto" },
];

export function BookForm({ initialData, categories, onSubmit, submitLabel = "Salva", coverFile }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [author, setAuthor] = useState(initialData?.author ?? "");
  const [year, setYear] = useState(initialData?.year ?? "");
  const [edition, setEdition] = useState(initialData?.edition ?? "");
  const [descriptionIt, setDescriptionIt] = useState(initialData?.descriptionIt ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initialData?.descriptionEn ?? "");
  const [descriptionRu, setDescriptionRu] = useState(initialData?.descriptionRu ?? "");
  const [marketPrice, setMarketPrice] = useState(initialData?.marketPrice ?? "");
  const [personalNotes, setPersonalNotes] = useState(initialData?.personalNotes ?? "");
  const [purchaseStatus, setPurchaseStatus] = useState(initialData?.purchaseStatus ?? "owned");
  const [purchaseLocation, setPurchaseLocation] = useState(initialData?.purchaseLocation ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchingPrice, setSearchingPrice] = useState(false);

  const addTag = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) setTags([...tags, trimmed]);
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
  };

  const handleSearchPrice = async () => {
    if (!title) return;
    setSearchingPrice(true);
    try {
      const res = await fetch("/api/books/price-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author: author || undefined }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.marketPrice != null) {
        setMarketPrice(String(data.marketPrice));
        toast.success(`Prezzo trovato: €${data.marketPrice}`);
      } else {
        toast.info("Prezzo non trovato online");
      }
    } catch {
      toast.error("Errore nella ricerca del prezzo");
    } finally {
      setSearchingPrice(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData();
    fd.append("title", title);
    if (author) fd.append("author", author);
    if (year) fd.append("year", year);
    if (edition) fd.append("edition", edition);
    if (descriptionIt) fd.append("descriptionIt", descriptionIt);
    if (descriptionEn) fd.append("descriptionEn", descriptionEn);
    if (descriptionRu) fd.append("descriptionRu", descriptionRu);
    if (marketPrice) fd.append("marketPrice", marketPrice);
    if (personalNotes) fd.append("personalNotes", personalNotes);
    if (purchaseStatus) fd.append("purchaseStatus", purchaseStatus);
    if (purchaseLocation) fd.append("purchaseLocation", purchaseLocation);
    if (categoryId) fd.append("categoryId", categoryId);
    fd.append("tags", tags.join(","));
    if (coverFile) fd.append("cover", coverFile);
    try { await onSubmit(fd); } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="title">Titolo *</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Titolo del libro" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="author">Autore</Label>
          <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Nome autore" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">Categoria</Label>
          <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Seleziona categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nessuna categoria</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="year">Anno</Label>
          <Input id="year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Es. 2023" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edition">Edizione</Label>
          <Input id="edition" value={edition} onChange={(e) => setEdition(e.target.value)} placeholder="Es. Prima edizione" />
        </div>

        {/* Price with manual search */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="price">Prezzo di mercato (€)</Label>
          <div className="flex gap-2">
            <Input
              id="price"
              type="number"
              step="0.01"
              value={marketPrice}
              onChange={(e) => setMarketPrice(e.target.value)}
              placeholder="Es. 25.00"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSearchPrice}
              disabled={searchingPrice || !title}
              className="shrink-0"
            >
              {searchingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="ml-1.5">Cerca prezzo</span>
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Stato</Label>
          <Select value={purchaseStatus} onValueChange={setPurchaseStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location">Luogo di acquisto</Label>
          <Input id="location" value={purchaseLocation} onChange={(e) => setPurchaseLocation(e.target.value)} placeholder="Es. Libreria Feltrinelli, Milano" />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label>Tag</Label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-muted border border-border">
                #{tag}
                <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} onBlur={() => tagInput && addTag(tagInput)} placeholder="Scrivi un tag e premi Invio" />
          <p className="text-xs text-muted-foreground">Premi Invio o virgola per aggiungere</p>
        </div>

        {/* Description tabs */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Descrizione</Label>
          <Tabs defaultValue="it">
            <TabsList className="mb-2">
              <TabsTrigger value="it">🇮🇹 Italiano</TabsTrigger>
              <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
              <TabsTrigger value="ru">🇷🇺 Русский</TabsTrigger>
            </TabsList>
            <TabsContent value="it">
              <Textarea value={descriptionIt} onChange={(e) => setDescriptionIt(e.target.value)} rows={3} placeholder="Descrizione in italiano" />
            </TabsContent>
            <TabsContent value="en">
              <Textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows={3} placeholder="Description in English" />
            </TabsContent>
            <TabsContent value="ru">
              <Textarea value={descriptionRu} onChange={(e) => setDescriptionRu(e.target.value)} rows={3} placeholder="Описание на русском" />
            </TabsContent>
          </Tabs>
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="notes">Note personali</Label>
          <Textarea id="notes" value={personalNotes} onChange={(e) => setPersonalNotes(e.target.value)} rows={2} placeholder="Le tue annotazioni personali" />
        </div>
      </div>

      <Button type="submit" disabled={submitting || !title} className="w-full sm:w-auto">
        {submitting ? "Salvataggio..." : submitLabel}
      </Button>
    </form>
  );
}
