import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="app-bg flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur md:p-8">
        <div className="mb-6">
          <Link
            href="/"
            className="font-heading text-3xl font-semibold text-teal-800"
          >
            Expenssa
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous à votre espace budget
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-teal-700 underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
