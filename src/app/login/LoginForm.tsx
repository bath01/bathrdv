"use client";

import { Lock } from "lucide-react";
import Image from "next/image";
import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(loginAction, {});

  return (
    <main className="grid min-h-full flex-1 place-items-center px-4 py-12">
      <div className="w-full max-w-sm animate-rise">
        <Image src="/logo.png" alt="BATHRDV" width={1208} height={784} priority className="mx-auto h-auto w-56" />
        <form action={formAction} className="card mt-8 space-y-4 p-6">
          <div>
            <h1 className="font-display text-xl font-extrabold text-ink">Espace administrateur</h1>
            <p className="mt-1 text-sm text-muted">Gérez vos rendez-vous et vos horaires.</p>
          </div>
          <div>
            <label className="label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="input"
            />
          </div>
          {state.error && (
            <p role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          )}
          <button className="btn w-full py-3" disabled={pending}>
            <Lock className="size-4" /> {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
