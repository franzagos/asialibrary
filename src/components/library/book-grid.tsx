"use client";

import Link from "next/link";
import Image from "next/image";

interface Book {
  id: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  marketPrice?: string | null;
}

interface Props {
  books: Book[];
}

export function BookGrid({ books }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {books.map((book) => (
        <Link
          key={book.id}
          href={`/library/${book.id}`}
          className="group flex flex-col gap-2"
        >
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted border border-border transition-all group-hover:shadow-md group-hover:scale-[1.02]">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#F5F0EE" }}>
                <span className="text-3xl">📚</span>
              </div>
            )}
          </div>
          <div className="space-y-0.5 px-0.5">
            <p className="text-sm font-medium leading-tight line-clamp-2 text-foreground">
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
