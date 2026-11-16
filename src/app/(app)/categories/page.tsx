import { requireUser } from "@/lib/session";
import { getUserCategories } from "@/lib/queries";
import { CategoriesClient } from "@/components/categories/categories-client";

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await getUserCategories(user.id);
  return <CategoriesClient categories={categories} />;
}
