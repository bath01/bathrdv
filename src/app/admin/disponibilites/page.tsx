import { CalendarOff, X } from "lucide-react";
import { ConfirmButton } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, TIMEZONE, todayInZone, zonedToUtc } from "@/lib/time";
import { removeBlockedDateAction } from "../actions";
import { AvailabilityForm, BlockedDateForm } from "./AvailabilityForm";

export default async function AvailabilityPage() {
  await requireAdmin();
  const today = todayInZone();
  const [rows, blocked] = await Promise.all([
    db.availability.findMany(),
    db.blockedDate.findMany({ where: { date: { gte: today } }, orderBy: { date: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Horaires</h1>
        <p className="mt-1 text-sm text-muted">
          Les clients réservent seulement dans ces plages. Fuseau horaire : {TIMEZONE}.
        </p>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold text-ink">Semaine type</h2>
        <AvailabilityForm
          initial={rows.map((r) => ({ weekday: r.weekday, startTime: r.startTime, endTime: r.endTime }))}
        />
      </section>

      <section className="card p-6">
        <h2 className="font-semibold text-ink">Jours fermés</h2>
        <p className="mt-1 text-sm text-muted">Congés, jours fériés, absences : aucune réservation ces jours-là.</p>
        <BlockedDateForm min={today} />
        {blocked.length > 0 && (
          <ul className="mt-5 divide-y divide-line rounded-xl border border-line">
            {blocked.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <CalendarOff className="size-4 text-muted" />
                <span className="font-medium text-ink">{formatDate(zonedToUtc(b.date, "12:00"))}</span>
                {b.reason && <span className="text-muted">· {b.reason}</span>}
                <form action={removeBlockedDateAction} className="ml-auto">
                  <input type="hidden" name="id" value={b.id} />
                  <ConfirmButton message="Rouvrir ce jour aux réservations ?" className="btn-danger px-2">
                    <X className="size-4" />
                    <span className="sr-only">Rouvrir</span>
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
