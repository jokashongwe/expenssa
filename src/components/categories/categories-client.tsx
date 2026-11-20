"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ActionForm } from "@/components/forms/action-form";
import { DeleteButton } from "@/components/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/lib/actions/categories";
import type { Category } from "@/lib/db/schema";

const COLOR_NAMES: Record<string, string> = {
  "#0d9488": "Turquoise",
  "#059669": "Vert",
  "#f59e0b": "Orange",
  "#3b82f6": "Bleu",
  "#8b5cf6": "Violet",
  "#ec4899": "Rose",
  "#ef4444": "Rouge",
  "#64748b": "Gris",
};

const COLORS = [
  "#0d9488",
  "#059669",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#64748b",
];

export function CategoriesClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-3xl font-medium">Catégories</h1>
          <p className="text-sm text-muted-foreground">
            Vos catégories de revenus et de dépenses, à votre façon
          </p>
        </div>
        <Dialog
          open={open || !!editing}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger
            render={<Button />}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            Ajouter
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Modifier la catégorie" : "Nouvelle catégorie"}
              </DialogTitle>
            </DialogHeader>
            <ActionForm
              action={editing ? updateCategoryAction : createCategoryAction}
              className="space-y-3"
              onSuccess={() => {
                setOpen(false);
                setEditing(null);
                router.refresh();
              }}
            >
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  defaultValue={editing?.name ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-type">Type</Label>
                <select
                  id="cat-type"
                  name="type"
                  required
                  defaultValue={editing?.type ?? "expense"}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="expense">Dépense</option>
                  <option value="income">Revenu</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label id="cat-color-label">Couleur</Label>
                <div
                  role="radiogroup"
                  aria-labelledby="cat-color-label"
                  className="flex flex-wrap gap-2"
                >
                  {COLORS.map((color) => (
                    <label key={color} className="cursor-pointer">
                      <span className="sr-only">{COLOR_NAMES[color]}</span>
                      <input
                        type="radio"
                        name="color"
                        value={color}
                        defaultChecked={
                          (editing?.color ?? COLORS[0]) === color
                        }
                        className="peer sr-only"
                      />
                      <span
                        className="block size-7 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                        style={{ background: color }}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <input type="hidden" name="icon" value={editing?.icon ?? "circle"} />
              <Button type="submit" className="w-full">
                Enregistrer
              </Button>
            </ActionForm>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card shadow-sm px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="size-3 rounded-full"
                style={{ background: cat.color }}
                aria-hidden
              />
              <div>
                <p className="font-medium">{cat.name}</p>
                <Badge variant="outline" className="mt-1">
                  {cat.type === "income" ? "Revenu" : "Dépense"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                aria-label={`Modifier la catégorie ${cat.name}`}
                onClick={() => setEditing(cat)}
              >
                Modifier
              </Button>
              <DeleteButton
                ariaLabel={`Supprimer la catégorie ${cat.name}`}
                confirmMessage={`Supprimer la catégorie « ${cat.name} » ?`}
                action={() => deleteCategoryAction(cat.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
