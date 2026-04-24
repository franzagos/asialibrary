"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookForm } from "./book-form";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Upload, ImagePlus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

type Step = "drop" | "processing" | "form";

interface IdentifyResult {
  identified: boolean;
  bookInfo: {
    title?: string;
    author?: string;
    year?: string;
    edition?: string;
  } | null;
  enrichment: {
    descriptionIt?: string;
    descriptionEn?: string;
    descriptionRu?: string;
  } | null;
}

export function UploadFlow({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("drop");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [identifyResult, setIdentifyResult] = useState<IdentifyResult | null>(null);
  const [enrichmentFailed, setEnrichmentFailed] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  }, []);

  const handleIdentify = async () => {
    if (!file) return;
    setStep("processing");

    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/books/identify", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data: IdentifyResult = await res.json();
      setIdentifyResult(data);
      if (data.identified && !data.enrichment?.descriptionIt && !data.enrichment?.descriptionEn && !data.enrichment?.descriptionRu) {
        setEnrichmentFailed(true);
      }
    } catch {
      setIdentifyResult({ identified: false, bookInfo: null, enrichment: null });
    }

    setStep("form");
  };

  const handleSave = async (formData: FormData) => {
    const res = await fetch("/api/books", { method: "POST", body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.error ?? "Errore durante il salvataggio");
      return;
    }
    toast.success("Libro aggiunto alla libreria!");
    router.push("/library");
  };

  const initialData = identifyResult?.identified && identifyResult.bookInfo
    ? {
        title: identifyResult.bookInfo.title,
        author: identifyResult.bookInfo.author,
        year: identifyResult.bookInfo.year,
        edition: identifyResult.bookInfo.edition,
        descriptionIt: identifyResult.enrichment?.descriptionIt,
        descriptionEn: identifyResult.enrichment?.descriptionEn,
        descriptionRu: identifyResult.enrichment?.descriptionRu,
      }
    : undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Link
        href="/library"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Libreria
      </Link>

      <h1 className="text-xl font-semibold mb-6">Aggiungi un libro</h1>

      {/* Step 1: Drop */}
      {step === "drop" && (
        <div className="space-y-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-primary bg-accent"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {preview ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-32 h-48 rounded-xl overflow-hidden shadow-md">
                  <Image src={preview} alt="Anteprima" fill className="object-cover" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {file?.name} · Clicca per cambiare
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#F5F0EE" }}>
                  <ImagePlus className="w-7 h-7" style={{ color: "var(--terracotta)" }} />
                </div>
                <div>
                  <p className="font-medium text-foreground">Carica la foto della copertina</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    <span className="hidden sm:inline">Trascina qui o </span>Clicca per selezionare
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP · max 5MB</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleIdentify}
              disabled={!file}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-1.5" />
              Identifica libro
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIdentifyResult(null);
                setStep("form");
              }}
            >
              Inserisci manualmente
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Processing */}
      {step === "processing" && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-muted/20">
            {preview && (
              <div className="relative w-16 h-24 rounded-lg overflow-hidden shrink-0">
                <Image src={preview} alt="Copertina" fill className="object-cover" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <p className="font-medium text-sm">Identifico il libro...</p>
              <p className="text-xs text-muted-foreground">Questo richiede qualche secondo</p>
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Form */}
      {step === "form" && (
        <div className="space-y-4">
          {identifyResult && !identifyResult.identified && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">
                Non sono riuscita a identificare il libro — compila i campi manualmente.
              </p>
            </div>
          )}
          {enrichmentFailed && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">
                Informazioni aggiuntive non disponibili — puoi completarle manualmente.
              </p>
            </div>
          )}
          {preview && identifyResult?.identified && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 mb-2">
              <div className="relative w-10 h-14 rounded-md overflow-hidden shrink-0">
                <Image src={preview} alt="Copertina" fill className="object-cover" />
              </div>
              <p className="text-sm text-muted-foreground">Foto caricata come copertina</p>
            </div>
          )}
          <BookForm
            initialData={initialData}
            categories={categories}
            onSubmit={handleSave}
            submitLabel="Salva nella libreria"
            coverFile={file}
          />
        </div>
      )}
    </div>
  );
}
