"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Copy, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Invite {
  id: string;
  token: string;
  email: string | null;
  used: boolean;
  usedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

function getStatus(invite: Invite): { label: string; color: string } {
  if (invite.used) return { label: "Usato", color: "text-muted-foreground" };
  if (new Date() > new Date(invite.expiresAt)) return { label: "Scaduto", color: "text-destructive" };
  return { label: "Attivo", color: "text-green-600" };
}

export function InvitesPanel({ invites: initial }: { invites: Invite[] }) {
  const [invites, setInvites] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const getLink = (token: string) =>
    `${window.location.origin}/register?token=${token}`;

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(getLink(token));
    setCopied(token);
    toast.success("Link copiato!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      const invite = await res.json();
      setInvites([invite, ...invites]);
      handleCopy(invite.token);
    } catch {
      toast.error("Errore nella creazione dell'invito");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <Link
        href="/library"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Libreria
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Gestione inviti</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Genera link di invito per nuovi utenti
          </p>
        </div>
        <Button onClick={handleCreate} disabled={creating}>
          <Plus className="w-4 h-4 mr-1.5" />
          Genera invito
        </Button>
      </div>

      {invites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl">
          <p className="text-muted-foreground text-sm">Nessun invito ancora</p>
          <p className="text-xs text-muted-foreground mt-1">
            Clicca &quot;Genera invito&quot; per creare un link da condividere
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Link</TableHead>
                <TableHead className="hidden sm:table-cell">Creato il</TableHead>
                <TableHead className="hidden sm:table-cell">Scade il</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => {
                const status = getStatus(invite);
                return (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded-md font-mono truncate max-w-[120px] sm:max-w-[200px]">
                          ...{invite.token.slice(-8)}
                        </code>
                        <button
                          onClick={() => handleCopy(invite.token)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
                        >
                          {copied === invite.token ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {new Date(invite.createdAt).toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {new Date(invite.expiresAt).toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
