"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  CheckCircle2,
  X,
  ChevronDown,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

type CardStatus = "pending" | "analyzing" | "ready" | "saving" | "saved" | "error";

interface BulkCard {
  uid: string;
  file: File;
  preview: string;
  status: CardStatus;
  title: string;
  author: string;
  year: string;
  edition: string;
  descriptionIt: string;
  descriptionEn: string;
  descriptionRu: string;
  marketPrice: string;
  pricePaid: string;
  personalNotes: string;
  purchaseStatus: string;
  purchaseLocation: string;
  categoryId: string;
  tags: string[];
  expanded: boolean;
}

const STATUS_OPTIONS = [
  { value: "owned", label: "Posseduto" },
  { value: "wishlist", label: "Lista dei desideri" },
  { value: "lent", label: "Prestato" },
  { value: "sold", label: "Venduto" },
];

function makeCard(file: File): BulkCard {
  return {
    uid: `${Date.now()}-${Math.random()}`,
    file,
    preview: URL.createObjectURL(file),
    status: "pending",
    title: "",
    author: "",
    year: "",
    edition: "",
    descriptionIt: "",
    descriptionEn: "",
    descriptionRu: "",
    marketPrice: "",
    pricePaid: "",
    personalNotes: "",
    purchaseStatus: "owned",
    purchaseLocation: "",
    categoryId: "",
    tags: [],
    expanded: false,
  };
}

async function identifyCard(card: BulkCard): Promise<Partial<BulkCard>> {
  const fd = new FormData();
  fd.append("image", card.file);
  const res = await fetch("/api/books/identify", { method: "POST", body: fd });
  if (!res.ok) throw new Error("identify failed");
  const data = await res.json();
  if (!data.identified || !data.bookInfo) return {};
  return {
    title: data.bookInfo.title ?? "",
    author: data.bookInfo.author ?? "",
    year: data.bookInfo.year ?? "",
    edition: data.bookInfo.edition ?? "",
    descriptionIt: data.enrichment?.descriptionIt ?? "",
    descriptionEn: data.enrichment?.descriptionEn ?? "",
    descriptionRu: data.enrichment?.descriptionRu ?? "",
  };
}

async function saveCard(card: BulkCard): Promise<void> {
  const fd = new FormData();
  fd.append("title", card.title || "Titolo sconosciuto");
  if (card.author) fd.append("author", card.author);
  if (card.year) fd.append("year", card.year);
  if (card.edition) fd.append("edition", card.edition);
  if (card.descriptionIt) fd.append("descriptionIt", card.descriptionIt);
  if (card.descriptionEn) fd.append("descriptionEn", card.descriptionEn);
  if (card.descriptionRu) fd.append("descriptionRu", card.descriptionRu);
  if (card.marketPrice) fd.append("marketPrice", card.marketPrice);
  if (card.pricePaid) fd.append("pricePaid", card.pricePaid);
  if (card.personalNotes) fd.append("personalNotes", card.personalNotes);
  if (card.purchaseStatus) fd.append("purchaseStatus", card.purchaseStatus);
  if (card.purchaseLocation) fd.append("purchaseLocation", card.purchaseLocation);
  if (card.categoryId) fd.append("categoryId", card.categoryId);
  fd.append("tags", card.tags.join(","));
  fd.append("cover", card.file);
  const res = await fetch("/api/books", { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "save failed");
  }
}

export function BulkUploadView({ categories }: { categories: Category[] }) {
  const [cards, setCards] = useState<BulkCard[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const update = (uid: string, patch: Partial<BulkCard>) =>
    setCards((prev) => prev.map((c) => (c.uid === uid ? { ...c, ...patch } : c)));

  const processCards = useCallback(async (newCards: BulkCard[]) => {
    setCards((prev) => [...prev, ...newCards]);

    // Process in batches of 5
    const BATCH = 5;
    for (let i = 0; i < newCards.length; i += BATCH) {
      const batch = newCards.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (card) => {
          setCards((prev) =>
            prev.map((c) => (c.uid === card.uid ? { ...c, status: "analyzing" } : c))
          );
          try {
            const patch = await identifyCard(card);
            setCards((prev) =>
              prev.map((c) =>
                c.uid === card.uid ? { ...c, ...patch, status: "ready" } : c
              )
            );
          } catch {
            setCards((prev) =>
              prev.map((c) => (c.uid === card.uid ? { ...c, status: "error" } : c))
            );
          }
        })
      );
    }
  }, []);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const active = cards.filter((c) => c.status !== "saved").length;
    const slots = 20 - active;
    const arr = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, slots);
    if (arr.length === 0) return;
    const newCards = arr.map(makeCard);
    processCards(newCards);
  }, [cards, processCards]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const active = cards.filter((c) => c.status !== "saved").length;
      const slots = 20 - active;
      const files = Array.from(e.dataTransfer.files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, slots);
      if (files.length === 0) return;
      const newCards = files.map(makeCard);
      processCards(newCards);
    },
    [cards, processCards]
  );

  const handleSaveAll = async () => {
    const toSave = cards.filter((c) => c.status === "ready");
    if (toSave.length === 0) return;
    setSavingAll(true);
    let saved = 0;
    for (const card of toSave) {
      update(card.uid, { status: "saving" });
      try {
        await saveCard(card);
        update(card.uid, { status: "saved" });
        saved++;
      } catch {
        update(card.uid, { status: "error" });
        toast.error(`Errore salvando "${card.title || "libro"}"`);
      }
    }
    setSavingAll(false);
    if (saved > 0) toast.success(`${saved} ${saved === 1 ? "libro salvato" : "libri salvati"}!`);
  };

  const handleSaveOne = async (uid: string) => {
    const card = cards.find((c) => c.uid === uid);
    if (!card) return;
    update(uid, { status: "saving" });
    try {
      await saveCard(card);
      update(uid, { status: "saved" });
      toast.success(`"${card.title || "Libro"}" salvato!`);
    } catch {
      update(uid, { status: "error" });
      toast.error("Errore durante il salvataggio");
    }
  };

  const removeCard = (uid: string) => {
    setCards((prev) => prev.filter((c) => c.uid !== uid));
  };

  const readyCount = cards.filter((c) => c.status === "ready").length;
  const analyzingCount = cards.filter((c) => c.status === "analyzing" || c.status === "pending").length;
  // Only count non-saved cards toward the 20-slot limit
  const activeCount = cards.filter((c) => c.status !== "saved").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/library"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Libreria
          </Link>
          <h1 className="text-xl font-semibold">Caricamento multiplo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Illimitate in totale · max 20 simultanee · identificate automaticamente
          </p>
        </div>
        {readyCount > 0 && (
          <Button onClick={handleSaveAll} disabled={savingAll}>
            {savingAll ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            Salva tutti ({readyCount})
          </Button>
        )}
      </div>

      {/* Drop zone — always visible; limit is on active (non-saved) cards */}
      {activeCount < 20 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-primary bg-accent"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F5F0EE" }}>
              <ImagePlus className="w-5 h-5" style={{ color: "var(--terracotta)" }} />
            </div>
            <p className="text-sm font-medium">
              {activeCount === 0
                ? "Trascina le copertine qui o clicca per selezionare"
                : `Aggiungi altre foto (${20 - activeCount} slot liberi)`}
            </p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP · max 5MB · 20 simultanee, illimitate in totale</p>
          </div>
        </div>
      )}

      {/* Status bar */}
      {cards.length > 0 && analyzingCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analisi in corso ({analyzingCount} {analyzingCount === 1 ? "libro" : "libri"})...
        </div>
      )}

      {/* Cards grid */}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <BulkCard
              key={card.uid}
              card={card}
              categories={categories}
              onUpdate={(patch) => update(card.uid, patch)}
              onSave={() => handleSaveOne(card.uid)}
              onRemove={() => removeCard(card.uid)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BulkCard({
  card,
  categories,
  onUpdate,
  onSave,
  onRemove,
}: {
  card: BulkCard;
  categories: Category[];
  onUpdate: (patch: Partial<BulkCard>) => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  const [tagInput, setTagInput] = useState("");

  const addTag = (val: string) => {
    const t = val.trim().toLowerCase();
    if (t && !card.tags.includes(t)) onUpdate({ tags: [...card.tags, t] });
    setTagInput("");
  };

  const isLocked = card.status === "analyzing" || card.status === "pending" || card.status === "saving" || card.status === "saved";

  return (
    <div className={`rounded-xl border overflow-hidden flex flex-col transition-all ${
      card.status === "saved" ? "border-green-200 bg-green-50/50" :
      card.status === "error" ? "border-red-200 bg-red-50/50" :
      "border-border bg-background"
    }`}>
      {/* Cover + status */}
      <div className="relative">
        <div className="aspect-[3/4] bg-muted relative overflow-hidden">
          <Image src={card.preview} alt="Copertina" fill className="object-cover" />
          {(card.status === "analyzing" || card.status === "pending") && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
          {card.status === "saving" && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
          {card.status === "saved" && (
            <div className="absolute inset-0 bg-green-900/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
          )}
          {card.status === "error" && (
            <div className="absolute top-2 left-2">
              <Badge variant="destructive" className="text-xs">Errore</Badge>
            </div>
          )}
        </div>
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Fields */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        {card.status === "analyzing" || card.status === "pending" ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-full rounded" />
            <Skeleton className="h-5 w-3/4 rounded" />
            <Skeleton className="h-5 w-1/2 rounded" />
          </div>
        ) : card.status === "saved" ? (
          <p className="text-sm font-medium text-green-700 py-1">{card.title || "Libro salvato"}</p>
        ) : (
          <>
            <Input
              value={card.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Titolo *"
              className="h-8 text-sm font-medium"
              disabled={isLocked}
            />
            <Input
              value={card.author}
              onChange={(e) => onUpdate({ author: e.target.value })}
              placeholder="Autore"
              className="h-8 text-sm"
              disabled={isLocked}
            />
            <div className="flex gap-2">
              <Input
                value={card.year}
                onChange={(e) => onUpdate({ year: e.target.value })}
                placeholder="Anno"
                className="h-8 text-sm w-20 shrink-0"
                disabled={isLocked}
              />
              <Select
                value={card.categoryId || "none"}
                onValueChange={(v) => onUpdate({ categoryId: v === "none" ? "" : v })}
                disabled={isLocked}
              >
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuna</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select
              value={card.purchaseStatus}
              onValueChange={(v) => onUpdate({ purchaseStatus: v })}
              disabled={isLocked}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tags */}
            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {card.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs bg-muted border border-border">
                    #{t}
                    {!isLocked && (
                      <button onClick={() => onUpdate({ tags: card.tags.filter((x) => x !== t) })}>
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
              }}
              onBlur={() => tagInput && addTag(tagInput)}
              placeholder="Tag (Invio per aggiungere)"
              className="h-8 text-xs"
              disabled={isLocked}
            />

            {/* Expandable: descriptions + prices + notes */}
            <button
              type="button"
              onClick={() => onUpdate({ expanded: !card.expanded })}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${card.expanded ? "rotate-180" : ""}`} />
              {card.expanded ? "Meno dettagli" : "Altri dettagli"}
            </button>

            {card.expanded && (
              <div className="space-y-2 pt-1">
                <Input
                  value={card.purchaseLocation}
                  onChange={(e) => onUpdate({ purchaseLocation: e.target.value })}
                  placeholder="Luogo di acquisto"
                  className="h-8 text-sm"
                  disabled={isLocked}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={card.pricePaid}
                    onChange={(e) => onUpdate({ pricePaid: e.target.value })}
                    placeholder="Prezzo pagato €"
                    className="h-8 text-sm"
                    disabled={isLocked}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={card.marketPrice}
                    onChange={(e) => onUpdate({ marketPrice: e.target.value })}
                    placeholder="Prezzo mercato €"
                    className="h-8 text-sm"
                    disabled={isLocked}
                  />
                </div>
                <Textarea
                  value={card.descriptionIt}
                  onChange={(e) => onUpdate({ descriptionIt: e.target.value })}
                  placeholder="Descrizione IT"
                  rows={2}
                  className="text-xs resize-none"
                  disabled={isLocked}
                />
                <Textarea
                  value={card.descriptionEn}
                  onChange={(e) => onUpdate({ descriptionEn: e.target.value })}
                  placeholder="Description EN"
                  rows={2}
                  className="text-xs resize-none"
                  disabled={isLocked}
                />
                <Textarea
                  value={card.descriptionRu}
                  onChange={(e) => onUpdate({ descriptionRu: e.target.value })}
                  placeholder="Описание RU"
                  rows={2}
                  className="text-xs resize-none"
                  disabled={isLocked}
                />
                <Textarea
                  value={card.personalNotes}
                  onChange={(e) => onUpdate({ personalNotes: e.target.value })}
                  placeholder="Note personali"
                  rows={2}
                  className="text-xs resize-none"
                  disabled={isLocked}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1 mt-auto">
              <Button
                size="sm"
                onClick={onSave}
                disabled={isLocked || !card.title}
                className="flex-1 h-8 text-xs"
              >
                {card.status === "saving" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Salva"
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
