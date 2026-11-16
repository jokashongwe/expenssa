import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="app-bg flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
        <p className="font-heading text-5xl font-semibold tracking-tight text-teal-800 md:text-6xl">
          Expenssa
        </p>
        <h1 className="mt-4 max-w-xl text-2xl font-medium text-foreground md:text-3xl">
          Votre budget, clairement.
        </h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Suivez revenus et dépenses, définissez des budgets et des plans
          d&apos;épargne — en dollars et en francs congolais.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button render={<Link href="/register" />} size="lg">
            Créer un compte
          </Button>
          <Button render={<Link href="/login" />} variant="outline" size="lg">
            Se connecter
          </Button>
        </div>
      </main>
    </div>
  );
}
