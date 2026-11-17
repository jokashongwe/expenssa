import { getUserCategories } from "@/lib/queries";
import { getSpaceContext } from "@/lib/space";
import { CategoriesClient } from "@/components/categories/categories-client";

export default async function CategoriesPage() {
  const space = await getSpaceContext();
  const categories = await getUserCategories(space.ownerId);
  return <CategoriesClient categories={categories} />;
}
