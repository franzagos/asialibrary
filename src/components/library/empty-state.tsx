import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  message?: string;
  showCta?: boolean;
}

export function EmptyState({ message = "Nessun libro ancora", showCta = true }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#F5F0EE" }}>
        <BookOpen className="w-8 h-8" style={{ color: "var(--terracotta)" }} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{message}</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Aggiungi libri fotografando la copertina.
      </p>
      {showCta && (
        <Button asChild>
          <Link href="/library/upload">Aggiungi il tuo primo libro</Link>
        </Button>
      )}
    </div>
  );
}
