"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Book {
  id: string;
  title: string;
  author?: string | null;
  year?: string | null;
  coverUrl?: string | null;
  marketPrice?: string | null;
  purchaseStatus?: string | null;
  categoryId?: string | null;
  tags?: string[];
  createdAt?: string | Date;
}

interface Category {
  id: string;
  name: string;
}

interface Props {
  books: Book[];
  categories: Category[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  owned: { label: "Posseduto", color: "bg-sage/20 text-sage border-sage/30" },
  wishlist: { label: "Lista desideri", color: "bg-ochre/20 text-ochre border-ochre/30" },
  lent: { label: "Prestato", color: "bg-blue-100 text-blue-700 border-blue-200" },
  sold: { label: "Venduto", color: "bg-muted text-muted-foreground" },
};

export function BookTable({ books, categories }: Props) {
  const catById: Record<string, string> = {};
  for (const c of categories) catById[c.id] = c.name;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12"></TableHead>
            <TableHead>Titolo</TableHead>
            <TableHead className="hidden sm:table-cell">Autore</TableHead>
            <TableHead className="hidden md:table-cell">Categoria</TableHead>
            <TableHead className="hidden lg:table-cell">Tags</TableHead>
            <TableHead className="hidden sm:table-cell">Prezzo</TableHead>
            <TableHead className="hidden md:table-cell">Stato</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {books.map((book) => {
            const status = book.purchaseStatus
              ? STATUS_LABELS[book.purchaseStatus]
              : null;
            return (
              <TableRow
                key={book.id}
                className="cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => (window.location.href = `/library/${book.id}`)}
              >
                <TableCell>
                  <div className="w-8 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt={book.title}
                        width={32}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">
                        📚
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/library/${book.id}`}
                    className="font-medium hover:underline line-clamp-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {book.title}
                  </Link>
                  <span className="sm:hidden block text-xs text-muted-foreground mt-0.5">
                    {book.author}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                  {book.author ?? "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {book.categoryId ? catById[book.categoryId] ?? "—" : "—"}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {(book.tags ?? []).slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {(book.tags ?? []).length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{(book.tags ?? []).length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm font-medium" style={{ color: book.marketPrice ? "var(--terracotta)" : undefined }}>
                  {book.marketPrice ? `€${parseFloat(book.marketPrice).toFixed(2)}` : "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {status && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                      {status.label}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
