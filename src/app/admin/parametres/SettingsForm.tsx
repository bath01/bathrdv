"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui";
import { MOBILE_MONEY } from "@/lib/ci";
import { saveSettingsAction, type FormState } from "../actions";

type Settings = {
  businessName: string;
  phone: string | null;
  address: string | null;
  waveNumber: string | null;
  orangeMoneyNumber: string | null;
  mtnMoneyNumber: string | null;
  moovMoneyNumber: string | null;
  pendingMinutes: number;
  minNoticeHours: number;
  bufferMinutes: number;
  bookingWindowDays: number;
};

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveSettingsAction, {});

  return (
    <form action={formAction} className="space-y-6">
      <section className="card grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="font-semibold text-ink sm:col-span-2">Votre activité</h2>
        <div>
          <label className="label" htmlFor="businessName">Nom affiché</label>
          <input id="businessName" name="businessName" defaultValue={settings.businessName} required className="input" />
          <p className="hint">Utilisé dans la signature des rappels WhatsApp.</p>
        </div>
        <div>
          <label className="label" htmlFor="phone">Numéro WhatsApp de contact</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={settings.phone ?? ""}
            placeholder="+225 07 07 07 07 07"
            className="input"
          />
          <p className="hint">Les clients vous écrivent et envoient leurs preuves de paiement ici.</p>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="address">Adresse du cabinet / de la boutique</label>
          <input
            id="address"
            name="address"
            defaultValue={settings.address ?? ""}
            placeholder="Cocody Riviera 3, rue des Jardins, immeuble Les Palmiers"
            className="input"
          />
          <p className="hint">Affichée pour les rendez-vous sur place sans lieu précis.</p>
        </div>
      </section>

      <section className="card grid gap-4 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="font-semibold text-ink">Mobile Money</h2>
          <p className="mt-1 text-sm text-muted">
            Numéros où vos clients paient les acomptes. Laissez vide les opérateurs que vous n&apos;utilisez pas.
          </p>
        </div>
        {MOBILE_MONEY.map((m) => (
          <div key={m.id}>
            <label className="label flex items-center gap-2" htmlFor={m.setting}>
              <span className="size-2.5 rounded-full" style={{ background: m.color }} aria-hidden /> {m.label}
            </label>
            <input
              id={m.setting}
              name={m.setting}
              type="tel"
              defaultValue={settings[m.setting] ?? ""}
              placeholder="07 07 07 07 07"
              className="input"
            />
          </div>
        ))}
        <div>
          <label className="label" htmlFor="pendingMinutes">Délai pour payer l&apos;acompte</label>
          <select id="pendingMinutes" name="pendingMinutes" defaultValue={settings.pendingMinutes} className="input">
            {[15, 30, 60, 120, 240, 1440].map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} min` : m === 1440 ? "24 h" : `${m / 60} h`}
              </option>
            ))}
          </select>
          <p className="hint">Passé ce délai sans paiement, le créneau est libéré.</p>
        </div>
      </section>

      <section className="card grid gap-4 p-6 sm:grid-cols-3">
        <h2 className="font-semibold text-ink sm:col-span-3">Règles de réservation</h2>
        <div>
          <label className="label" htmlFor="minNoticeHours">Délai minimum</label>
          <select id="minNoticeHours" name="minNoticeHours" defaultValue={settings.minNoticeHours} className="input">
            {[0, 1, 2, 4, 12, 24, 48].map((h) => (
              <option key={h} value={h}>
                {h === 0 ? "Aucun" : h < 24 ? `${h} h avant` : `${h / 24} jour${h > 24 ? "s" : ""} avant`}
              </option>
            ))}
          </select>
          <p className="hint">Évite les réservations de dernière minute.</p>
        </div>
        <div>
          <label className="label" htmlFor="bufferMinutes">Pause entre deux RDV</label>
          <select id="bufferMinutes" name="bufferMinutes" defaultValue={settings.bufferMinutes} className="input">
            {[0, 5, 10, 15, 30, 60].map((m) => (
              <option key={m} value={m}>
                {m === 0 ? "Aucune" : `${m} min`}
              </option>
            ))}
          </select>
          <p className="hint">Temps pour les déplacements et les embouteillages.</p>
        </div>
        <div>
          <label className="label" htmlFor="bookingWindowDays">Réservable jusqu&apos;à</label>
          <select
            id="bookingWindowDays"
            name="bookingWindowDays"
            defaultValue={settings.bookingWindowDays}
            className="input"
          >
            {[7, 14, 30, 60, 90].map((d) => (
              <option key={d} value={d}>
                {d} jours à l&apos;avance
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button className="btn" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les paramètres"}
        </button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
