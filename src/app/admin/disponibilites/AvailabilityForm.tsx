"use client";

import { Coffee, Flag } from "lucide-react";
import { useActionState, useState } from "react";
import { FormMessage } from "@/components/ui";
import { addBlockedDateAction, importHolidaysAction, saveAvailabilityAction, type FormState } from "../actions";

type Row = { weekday: number; startTime: string; endTime: string };

const WEEKDAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
// Monday first, like a French calendar.
const ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Turns the stored ranges of one day into the form shape: day + optional lunch break. */
function dayShape(rows: Row[]) {
  const sorted = [...rows].sort((a, b) => a.startTime.localeCompare(b.startTime));
  if (sorted.length === 0) return null;
  const first = sorted[0];
  const last = sorted.at(-1)!;
  return {
    start: first.startTime,
    end: last.endTime,
    hasBreak: sorted.length > 1,
    breakStart: sorted.length > 1 ? first.endTime : "12:00",
    breakEnd: sorted.length > 1 ? sorted[1].startTime : "14:00",
  };
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative h-5 w-9 shrink-0 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-blue ${
        on ? "bg-blue" : "bg-line"
      }`}
    >
      <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition ${on ? "left-4.5" : "left-0.5"}`} />
    </span>
  );
}

export function AvailabilityForm({ initial }: { initial: Row[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveAvailabilityAction, {});
  const shapes = Object.fromEntries(ORDER.map((d) => [d, dayShape(initial.filter((r) => r.weekday === d))]));
  const [enabled, setEnabled] = useState(() => new Set(ORDER.filter((d) => shapes[d])));
  const [breaks, setBreaks] = useState(() => new Set(ORDER.filter((d) => shapes[d]?.hasBreak)));

  const toggle = (set: Set<number>, setter: (s: Set<number>) => void, day: number) => {
    const next = new Set(set);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setter(next);
  };

  return (
    <form action={formAction} className="mt-4">
      <div className="divide-y divide-line">
        {ORDER.map((weekday) => {
          const shape = shapes[weekday];
          const on = enabled.has(weekday);
          const hasBreak = breaks.has(weekday);
          const name = WEEKDAYS[weekday];
          return (
            <div key={weekday} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <label className="flex w-32 cursor-pointer items-center gap-3 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  name={`day-${weekday}-on`}
                  checked={on}
                  onChange={() => toggle(enabled, setEnabled, weekday)}
                  className="peer sr-only"
                />
                <Switch on={on} />
                {name}
              </label>

              {on ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <input
                    type="time"
                    aria-label={`${name}, ouverture`}
                    name={`day-${weekday}-start`}
                    defaultValue={shape?.start ?? "08:00"}
                    className="input w-28"
                  />
                  {hasBreak && (
                    <>
                      <span className="text-muted">à</span>
                      <input
                        type="time"
                        aria-label={`${name}, début de pause`}
                        name={`day-${weekday}-bstart`}
                        defaultValue={shape?.breakStart ?? "12:00"}
                        className="input w-28"
                      />
                      <span className="chip">
                        <Coffee className="size-3.5" /> pause
                      </span>
                      <input
                        type="time"
                        aria-label={`${name}, reprise`}
                        name={`day-${weekday}-bend`}
                        defaultValue={shape?.breakEnd ?? "14:00"}
                        className="input w-28"
                      />
                    </>
                  )}
                  <span className="text-muted">à</span>
                  <input
                    type="time"
                    aria-label={`${name}, fermeture`}
                    name={`day-${weekday}-end`}
                    defaultValue={shape?.end ?? "18:00"}
                    className="input w-28"
                  />
                  <label className="ml-1 inline-flex cursor-pointer items-center gap-2 text-muted">
                    <input
                      type="checkbox"
                      name={`day-${weekday}-break`}
                      checked={hasBreak}
                      onChange={() => toggle(breaks, setBreaks, weekday)}
                      className="size-4 accent-blue"
                    />
                    Pause déjeuner
                  </label>
                </div>
              ) : (
                <span className="text-sm text-muted">Fermé</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button className="btn" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les horaires"}
        </button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function BlockedDateForm({ min }: { min: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(addBlockedDateAction, {});
  const [holidayState, importAction, importing] = useActionState<FormState, FormData>(() => importHolidaysAction(), {});
  return (
    <div className="mt-4 space-y-4">
      <form action={importAction} className="flex flex-wrap items-center gap-3 rounded-xl bg-mist p-3">
        <Flag className="size-4 text-blue" />
        <p className="flex-1 text-sm text-slate">
          Fermer automatiquement les jours fériés ivoiriens (Pâques, 7 août, 15 novembre…)
        </p>
        <button className="btn-ghost" disabled={importing}>
          {importing ? "Ajout…" : "Ajouter les jours fériés"}
        </button>
        {holidayState.ok && <p className="w-full text-xs text-success">Jours fériés ajoutés.</p>}
      </form>
      <p className="text-xs text-muted">
        Korité, Tabaski, Maouloud et Nuit du Destin changent chaque année : ajoutez-les ci-dessous dès l&apos;annonce
        officielle.
      </p>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="blocked-date">Date</label>
          <input id="blocked-date" type="date" name="date" min={min} required className="input w-44" />
        </div>
        <div className="min-w-48 flex-1">
          <label className="label" htmlFor="blocked-reason">
            Raison <span className="font-normal text-muted">(facultatif)</span>
          </label>
          <input id="blocked-reason" name="reason" placeholder="Tabaski, congés…" className="input" />
        </div>
        <button className="btn" disabled={pending}>
          {pending ? "Ajout…" : "Fermer ce jour"}
        </button>
        {state.error && <p className="w-full text-sm text-danger">{state.error}</p>}
      </form>
    </div>
  );
}
