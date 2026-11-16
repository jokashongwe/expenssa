import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="app-bg flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur md:p-8">
        <div className="mb-6">
          <Link
            href="/"
            className="font-sans text-3xl font-medium text-teal-800"
          >
            Expenssa
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Créez votre compte — USD est prêt par défaut
          </p>
        </div>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-teal-700 underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
