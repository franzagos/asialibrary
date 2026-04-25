"use client";

import Link from "next/link";
import Image from "next/image";

interface Book {
  id: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  marketPrice?: string | null;
  purchaseStatus?: string | null;
}

interface Props {
  books: Book[];
}

export function BookGrid({ books }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {books.map((book) => (
        <Link
          key={book.id}
          href={`/library/${book.id}`}
          className="group flex flex-col gap-2 active:scale-[0.97] transition-transform"
        >
          <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-sm transition-all group-hover:shadow-lg group-hover:scale-[1.02]">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3" style={{ backgroundColor: "#F5F0EE" }}>
                <span className="text-3xl">📚</span>
                <p className="text-[10px] text-center leading-tight font-medium text-foreground/60 line-clamp-3">
                  {book.title}
                </p>
              </div>
            )}
            {book.purchaseStatus === "wishlist" && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                <span className="text-[10px]">❤️</span>
              </div>
            )}
            {book.purchaseStatus === "lent" && (
              <div className="absolute top-2 left-2">
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Prestato
                </span>
              </div>
            )}
          </div>
          <div className="space-y-0.5 px-0.5">
            <p className="text-sm font-semibold leading-tight line-clamp-2 text-foreground">
              {book.title}
            </p>
            {book.author && (
              <p className="text-xs text-muted-foreground truncate">{book.author}</p>
            )}
            {book.marketPrice && (
              <p className="text-xs font-medium" style={{ color: "var(--terracotta)" }}>
                €{parseFloat(book.marketPrice).toFixed(2)}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
