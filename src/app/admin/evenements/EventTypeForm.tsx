"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/ui";
import { saveEventTypeAction, type FormState } from "../actions";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // strip accents: é -> e
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type Initial = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  duration: number;
  price: number | null;
  deposit: number | null;
  atHome: boolean;
};

const DURATIONS = [15, 20, 30, 45, 60, 90, 120];
const LOCATIONS = ["Google Meet", "Zoom", "Appel téléphonique", "WhatsApp vidéo", "En présentiel"];

/** Create form when `initial` is missing, edit form otherwise. */
export function EventTypeForm({ initial }: { initial?: Initial }) {
  const editing = !!initial;
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(editing);

  const [state, formAction, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await saveEventTypeAction(prev, formData);
    // React resets uncontrolled fields after a create; reset the slug state too.
    if (result.ok && !editing) {
      setSlug("");
      setSlugEdited(false);
    }
    return result;
  }, {});

  const durations = initial && !DURATIONS.includes(initial.duration) ? [...DURATIONS, initial.duration] : DURATIONS;
  const listId = `locations-${initial?.id ?? "new"}`;

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div>
        <label className="label" htmlFor={`title-${listId}`}>Titre</label>
        <input
          id={`title-${listId}`}
          name="title"
          required
          defaultValue={initial?.title}
          placeholder="Consultation découverte"
          className="input"
          onChange={(e) => !slugEdited && setSlug(slugify(e.target.value))}
        />
      </div>
      <div>
        <label className="label" htmlFor={`slug-${listId}`}>Lien de réservation</label>
        <div className="flex items-center rounded-xl border border-line bg-mist focus-within:border-blue focus-within:ring-4 focus-within:ring-blue/10">
          <span className="pl-3.5 text-sm text-muted">/</span>
          <input
            id={`slug-${listId}`}
            name="slug"
            required
            value={slug}
            placeholder="consultation-decouverte"
            className="w-full rounded-r-xl bg-surface px-2 py-2.5 text-sm outline-none"
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(e.target.value);
            }}
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor={`duration-${listId}`}>Durée</label>
        <select
          id={`duration-${listId}`}
          name="duration"
          defaultValue={initial?.duration ?? 30}
          className="input"
        >
          {durations.map((d) => (
            <option key={d} value={d}>
              {d < 60 ? `${d} min` : `${Math.floor(d / 60)} h${d % 60 ? ` ${d % 60}` : ""}`}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`location-${listId}`}>
          Lieu <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <input
          id={`location-${listId}`}
          name="location"
          list={listId}
          defaultValue={initial?.location ?? ""}
          placeholder="Google Meet, adresse…"
          className="input"
        />
        <datalist id={listId}>
          {LOCATIONS.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="label" htmlFor={`price-${listId}`}>
          Prix en FCFA <span className="font-normal text-muted">(vide = gratuit)</span>
        </label>
        <input
          id={`price-${listId}`}
          name="price"
          type="number"
          min={0}
          step={500}
          inputMode="numeric"
          defaultValue={initial?.price ?? ""}
          placeholder="15000"
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor={`deposit-${listId}`}>
          Acompte Mobile Money <span className="font-normal text-muted">(vide = aucun)</span>
        </label>
        <input
          id={`deposit-${listId}`}
          name="deposit"
          type="number"
          min={0}
          step={500}
          inputMode="numeric"
          defaultValue={initial?.deposit ?? ""}
          placeholder="5000"
          className="input"
        />
        <p className="hint">Réduit les rendez-vous non honorés : le client paie pour bloquer le créneau.</p>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 sm:col-span-2">
        <input type="checkbox" name="atHome" defaultChecked={initial?.atHome} className="mt-0.5 size-4 accent-blue" />
        <span className="text-sm">
          <span className="font-medium text-ink">Rendez-vous à domicile</span>
          <span className="block text-muted">Le client indique sa commune et son quartier avec un repère.</span>
        </span>
      </label>
      <div className="sm:col-span-2">
        <label className="label" htmlFor={`description-${listId}`}>
          Description <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <textarea
          id={`description-${listId}`}
          name="description"
          rows={2}
          defaultValue={initial?.description ?? ""}
          placeholder="Ce que le client doit savoir avant de réserver"
          className="input resize-none"
        />
      </div>
      <div className="flex items-center gap-4 sm:col-span-2">
        <button className="btn" disabled={pending}>
          {pending ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Créer le type de RDV"}
        </button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
