"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { switchSpaceAction } from "@/lib/actions/sharing";

export type SwitcherSpace = { ownerId: string; name: string };

export function SpaceSwitcher({
  activeOwnerId,
  ownUserId,
  ownName,
  spaces,
  className,
}: {
  activeOwnerId: string;
  ownUserId: string;
  ownName: string;
  spaces: SwitcherSpace[];
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  // Rien à changer si aucun espace n'est partagé avec l'utilisateur
  if (spaces.length === 0) return null;

  const all: SwitcherSpace[] = [
    { ownerId: ownUserId, name: `${ownName} (mon espace)` },
    ...spaces,
  ];
  const current = all.find((s) => s.ownerId === activeOwnerId) ?? all[0];

  function choose(ownerId: string) {
    if (ownerId === activeOwnerId) return;
    start(async () => {
      const res = await switchSpaceAction(ownerId);
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            aria-label={`Espace actif : ${current.name}. Changer d'espace`}
            className={`w-full justify-between ${className ?? ""}`}
          />
        }
      >
        <span className="truncate">{current.name}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Changer d&apos;espace</DropdownMenuLabel>
          {all.map((s) => (
            <DropdownMenuItem key={s.ownerId} onClick={() => choose(s.ownerId)}>
              <span className="flex-1 truncate">{s.name}</span>
              {s.ownerId === activeOwnerId ? (
                <Check className="size-4" aria-hidden />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
