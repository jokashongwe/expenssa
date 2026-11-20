"use client";

import { EmptyState } from "@/components/empty-state";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ActionForm } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  acceptShareAction,
  declineShareAction,
  inviteToSpaceAction,
  revokeShareAction,
  switchSpaceAction,
} from "@/lib/actions/sharing";

type Outgoing = {
  id: string;
  status: string;
  memberName: string;
  memberEmail: string;
};

type Incoming = {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
};

type Accessible = {
  shareId: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
};

export function SharingClient({
  activeOwnerId,
  ownUserId,
  ownName,
  outgoing,
  incoming,
  accessible,
}: {
  activeOwnerId: string;
  ownUserId: string;
  ownName: string;
  outgoing: Outgoing[];
  incoming: Incoming[];
  accessible: Accessible[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(
    fn: () => Promise<{ error?: string; success?: string }>
  ) {
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else if (res.success) toast.success(res.success);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-sans text-3xl font-medium">Votre espace à deux</h1>
        <p className="text-sm text-muted-foreground">
          Invitez votre partenaire (ou un proche) : vous gérez le même budget,
          avec les mêmes revenus, dépenses et objectifs.
        </p>
      </div>

      <section className="space-y-3 rounded-2xl border border-border/70 bg-card shadow-sm p-4">
        <h2 className="font-medium">Espace actif</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeOwnerId === ownUserId ? "default" : "outline"}
            disabled={pending || activeOwnerId === ownUserId}
            onClick={() => run(() => switchSpaceAction(ownUserId))}
          >
            Mon espace ({ownName})
          </Button>
          {accessible.map((s) => (
            <Button
              key={s.shareId}
              type="button"
              size="sm"
              variant={activeOwnerId === s.ownerId ? "default" : "outline"}
              disabled={pending || activeOwnerId === s.ownerId}
              onClick={() => run(() => switchSpaceAction(s.ownerId))}
            >
              {s.ownerName}
            </Button>
          ))}
        </div>
      </section>

      {incoming.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-warning-border bg-warning text-warning-foreground p-4">
          <h2 className="font-medium">Invitations reçues</h2>
          {incoming.map((inv) => (
            <div
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <p className="text-sm">
                <strong>{inv.ownerName}</strong> ({inv.ownerEmail}) vous invite
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => acceptShareAction(inv.id))}
                >
                  Accepter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => run(() => declineShareAction(inv.id))}
                >
                  Refuser
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3 rounded-2xl border border-border/70 bg-card shadow-sm p-4">
        <h2 className="font-medium">Inviter mon partenaire</h2>
        <ActionForm
          action={inviteToSpaceAction}
          className="flex flex-wrap items-end gap-3"
          onSuccess={() => router.refresh()}
        >
          <div className="min-w-[220px] flex-1 space-y-2">
            <Label htmlFor="email">Email du compte Expenssa</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="ami@email.com"
            />
          </div>
          <Button type="submit">Envoyer l&apos;invitation</Button>
        </ActionForm>
      </section>

      <section className="space-y-3 rounded-2xl border border-border/70 bg-card shadow-sm p-4">
        <h2 className="font-medium">Personnes ayant accès à mon espace</h2>
        {outgoing.length === 0 ? (
          <EmptyState bordered={false} icon={Users} title="Aucun partage pour l'instant" description="Invitez une personne pour lui donner accès à votre espace." />
        ) : (
          <ul className="space-y-2">
            {outgoing.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{row.memberName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.memberEmail}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {row.status === "accepted" ? "Actif" : "En attente"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => run(() => revokeShareAction(row.id))}
                  >
                    Révoquer
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
