"use client";

import { ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useActionState, useMemo, useState, useTransition } from "react";
import { bookAction, getSlotsAction, type BookingState } from "@/app/actions";
import { ABIDJAN_COMMUNES, formatFCFA } from "@/lib/ci";

const WEEKDAY_HEADERS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

/** "YYYY-MM-DD" helpers. Dates are calendar days, so UTC math is safe. */
const asDate = (d: string) => new Date(`${d}T12:00:00Z`);
const toKey = (d: Date) => d.toISOString().slice(0, 10);
const monthKey = (d: string) => d.slice(0, 7);

const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
const longDayFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
/** "Lundi 9 novembre" */
const longDay = {
  format: (d: Date) => {
    const text = longDayFormat.format(d);
    return text.charAt(0).toUpperCase() + text.slice(1);
  },
};

type Props = {
  eventTypeId: string;
  duration: number;
  atHome: boolean;
  deposit: number | null;
  openDates: string[];
  today: string;
  timezone: string;
};

export function BookingFlow({ eventTypeId, duration, atHome, deposit, openDates, today, timezone }: Props) {
  const timeLabel = useMemo(
    () => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: timezone }),
    [timezone],
  );
  const open = useMemo(() => new Set(openDates), [openDates]);

  const [month, setMonth] = useState(monthKey(openDates[0] ?? today));
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [start, setStart] = useState<string | null>(null);
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [loading, startLoading] = useTransition();

  const [state, formAction, submitting] = useActionState<BookingState, FormData>(async (prev, formData) => {
    const result = await bookAction(prev, formData);
    // Slot taken meanwhile: go back to the times and refresh them.
    if (result.slotTaken && date) {
      setStep("pick");
      setStart(null);
      setSlots(await getSlotsAction(eventTypeId, date));
    }
    return result;
  }, {});

  const firstMonth = monthKey(today);
  const lastMonth = monthKey(openDates.at(-1) ?? today);

  function pickDate(d: string) {
    setDate(d);
    setStart(null);
    startLoading(async () => setSlots(await getSlotsAction(eventTypeId, d)));
  }

  function shiftMonth(delta: number) {
    const d = asDate(`${month}-01`);
    d.setUTCMonth(d.getUTCMonth() + delta);
    setMonth(toKey(d).slice(0, 7));
  }

  // Calendar grid: Monday-first weeks covering the month.
  const cells = useMemo(() => {
    const first = asDate(`${month}-01`);
    const offset = (first.getUTCDay() + 6) % 7;
    const days: (string | null)[] = Array(offset).fill(null);
    const d = new Date(first);
    while (toKey(d).startsWith(month)) {
      days.push(toKey(d));
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return days;
  }, [month]);

  if (step === "details" && date && start) {
    return (
      <section className="animate-rise p-6 sm:p-8">
        <button type="button" onClick={() => setStep("pick")} className="btn-ghost">
          <ArrowLeft className="size-4" /> Changer l&apos;heure
        </button>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-blue-soft px-4 py-3 text-sm font-medium text-ink">
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4 text-blue" /> {longDay.format(asDate(date))}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="size-4 text-blue" /> {timeLabel.format(new Date(start))} –{" "}
            {timeLabel.format(new Date(new Date(start).getTime() + duration * 60_000))}
          </span>
        </div>

        <form action={formAction} className="mt-6 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="eventTypeId" value={eventTypeId} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="start" value={start} />
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">Nom complet</label>
            <input id="name" name="name" required minLength={2} autoComplete="name" autoFocus className="input" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Téléphone (WhatsApp)</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              placeholder="07 07 07 07 07"
              className="input"
            />
            <p className="hint">Indicatif +225 ajouté si absent.</p>
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email <span className="font-normal text-muted">(facultatif)</span>
            </label>
            <input id="email" name="email" type="email" autoComplete="email" className="input" />
          </div>
          {atHome && (
            <>
              <div>
                <label className="label" htmlFor="commune">Commune</label>
                <select id="commune" name="commune" required defaultValue="" className="input">
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {ABIDJAN_COMMUNES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                  <option>Hors Abidjan</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="quartier">Quartier et repère</label>
                <input
                  id="quartier"
                  name="quartier"
                  required
                  placeholder="Riviera 2, après la pharmacie…"
                  className="input"
                />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <label className="label" htmlFor="notes">
              Motif ou message <span className="font-normal text-muted">(facultatif)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Ce qui nous aidera à préparer le rendez-vous"
              className="input resize-none"
            />
          </div>
          {state.error && (
            <p role="alert" className="text-sm text-danger sm:col-span-2">
              {state.error}
            </p>
          )}
          <button className="btn py-3 sm:col-span-2" disabled={submitting}>
            {submitting && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {submitting
              ? "Réservation en cours…"
              : deposit
                ? `Réserver et payer l'acompte (${formatFCFA(deposit)})`
                : "Confirmer le rendez-vous"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_200px]">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">{monthLabel.format(asDate(`${month}-01`))}</h2>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Mois précédent"
              disabled={month <= firstMonth}
              onClick={() => shiftMonth(-1)}
              className="grid size-9 place-items-center rounded-lg text-slate transition hover:bg-mist disabled:opacity-30"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Mois suivant"
              disabled={month >= lastMonth}
              onClick={() => shiftMonth(1)}
              className="grid size-9 place-items-center rounded-lg text-slate transition hover:bg-mist disabled:opacity-30"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_HEADERS.map((w) => (
            <span key={w} className="pb-2 text-xs font-medium text-muted uppercase">
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={`empty-${i}`} />;
            const available = open.has(d);
            const selected = d === date;
            return (
              <button
                key={d}
                type="button"
                disabled={!available}
                onClick={() => pickDate(d)}
                aria-pressed={selected}
                aria-label={longDay.format(asDate(d))}
                className={`relative mx-auto grid aspect-square w-full max-w-12 place-items-center rounded-xl text-sm font-semibold transition ${
                  selected
                    ? "bg-blue text-white shadow-md shadow-blue/30"
                    : available
                      ? "bg-blue-soft text-blue hover:bg-blue hover:text-white"
                      : "text-muted/40"
                }`}
              >
                {Number(d.slice(8))}
                {d === today && !selected && (
                  <span className="absolute bottom-1.5 size-1 rounded-full bg-current" aria-hidden />
                )}
                {selected && (
                  // The check badge from the logo marks the chosen day.
                  <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-white text-blue ring-2 ring-blue">
                    <Check className="size-2.5" strokeWidth={4} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {openDates.length === 0 && (
          <p className="mt-4 text-sm text-muted">Aucune date n&apos;est ouverte pour le moment.</p>
        )}
      </div>

      <div className="lg:border-l lg:border-line lg:pl-6">
        {!date ? (
          <p className="text-sm text-muted">Sélectionnez une date pour voir les heures libres.</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-ink">{longDay.format(asDate(date))}</p>
            <div className="mt-3 grid max-h-80 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-1">
              {loading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className="h-10 animate-pulse rounded-xl bg-mist" />
                ))
              ) : slots.length === 0 ? (
                <p className="col-span-full text-sm text-muted">
                  Plus aucune heure libre ce jour-là. Essayez une autre date.
                </p>
              ) : (
                slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStart(s);
                      setStep("details");
                    }}
                    className="rounded-xl border border-blue/30 py-2.5 text-sm font-semibold text-blue tabular-nums transition hover:border-blue hover:bg-blue hover:text-white"
                  >
                    {timeLabel.format(new Date(s))}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
