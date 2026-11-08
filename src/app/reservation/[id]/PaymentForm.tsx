"use client";

import { Check, Copy } from "lucide-react";
import { useActionState, useState } from "react";
import { submitPaymentAction, type PaymentState } from "@/app/actions";

type Provider = { id: string; label: string; color: string; number: string };

/** Mobile Money instructions + form to send the transaction reference. */
export function PaymentForm({ bookingId, amount, providers }: { bookingId: string; amount: string; providers: Provider[] }) {
  const [method, setMethod] = useState(providers[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState<PaymentState, FormData>(submitPaymentAction, {});
  const current = providers.find((p) => p.id === method);

  if (providers.length === 0) {
    return (
      <p className="mt-4 rounded-xl bg-mist p-4 text-sm text-slate">
        Le paiement en ligne n&apos;est pas encore configuré. Contactez-nous sur WhatsApp pour régler l&apos;acompte.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <input type="hidden" name="id" value={bookingId} />
      <input type="hidden" name="method" value={method} />

      <fieldset>
        <legend className="label">1. Choisissez votre moyen de paiement</legend>
        <div className="grid grid-cols-2 gap-2">
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === method}
              onClick={() => setMethod(p.id)}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                p.id === method ? "border-blue bg-blue-soft text-ink ring-2 ring-blue/20" : "border-line text-slate hover:border-slate/30"
              }`}
            >
              <span className="size-3 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      {current && (
        <div className="rounded-xl bg-mist p-4 text-sm">
          <p className="label">2. Envoyez {amount} au numéro</p>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2 ring-1 ring-line">
            <span className="font-display text-lg font-extrabold tracking-wide text-ink tabular-nums">{current.number}</span>
            <button
              type="button"
              className="btn-ghost px-2.5 py-1.5"
              onClick={async () => {
                await navigator.clipboard.writeText(current.number.replace(/\s/g, ""));
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="label" htmlFor="ref">
          3. Référence de la transaction
        </label>
        <input id="ref" name="ref" required minLength={4} placeholder="Ex. : CI251108.1532.A12345" className="input" />
        <p className="hint">Vous la trouvez dans le SMS de confirmation de {current?.label ?? "votre opérateur"}.</p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button className="btn w-full py-3" disabled={pending}>
        {pending && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {pending ? "Envoi…" : "J'ai payé, envoyer la référence"}
      </button>
    </form>
  );
}
