import { formatInTimeZone } from "date-fns-tz";
import { BellRing, CalendarDays, Check, Home, MessageCircle, Phone, Plus, UserCheck, UserX, Wallet } from "lucide-react";
import Link from "next/link";
import { ConfirmButton } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatPhone, whatsappUrl } from "@/lib/calendar-links";
import { formatFCFA, mobileMoneyLabel } from "@/lib/ci";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { holdsSlot } from "@/lib/slots";
import { addDaysToDate, formatDate, formatTime, TIMEZONE, todayInZone, zonedToUtc } from "@/lib/time";
import {
  cancelBookingAction,
  confirmPaymentAction,
  markAttendanceAction,
  rejectPaymentAction,
} from "./actions";

const VIEWS = {
  avenir: "À venir",
  passes: "Passés",
  annules: "Annulés",
} as const;
type View = keyof typeof VIEWS;

type BookingRow = Awaited<ReturnType<typeof db.booking.findMany<{ include: { eventType: true } }>>>[number];

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const params = await searchParams;
  const vue = typeof params.vue === "string" ? params.vue : "";
  const view: View = vue in VIEWS ? (vue as View) : "avenir";

  const now = new Date();
  const today = todayInZone();
  const todayStart = zonedToUtc(today, "00:00");
  const tomorrowStart = zonedToUtc(addDaysToDate(today, 1), "00:00");
  const weekEnd = zonedToUtc(addDaysToDate(today, 7), "00:00");
  const monthStart = zonedToUtc(`${today.slice(0, 7)}-01`, "00:00");

  const confirmed = { status: "CONFIRMED" as const };
  const include = { eventType: true } as const;
  const settings = await getSettings();

  const [todayCount, weekCount, monthDone, next, toValidate, bookings, eventTypeCount, noShows] = await Promise.all([
    db.booking.count({ where: { ...confirmed, startTime: { gte: todayStart, lt: tomorrowStart } } }),
    db.booking.count({ where: { ...confirmed, startTime: { gte: now, lt: weekEnd } } }),
    // Expected income this month: confirmed meetings with a price, minus no-shows.
    db.booking.findMany({
      where: { ...confirmed, startTime: { gte: monthStart }, NOT: { attended: false } },
      select: { eventType: { select: { price: true } } },
    }),
    db.booking.findFirst({ where: { ...confirmed, endTime: { gte: now } }, orderBy: { startTime: "asc" }, include }),
    db.booking.findMany({
      // Unpaid bookings past the payment delay released their slot: hide them.
      where: { AND: [{ status: "PENDING" }, holdsSlot(settings.pendingMinutes)], endTime: { gte: now } },
      orderBy: { startTime: "asc" },
      include,
    }),
    db.booking.findMany({
      where:
        view === "avenir"
          ? { ...confirmed, endTime: { gte: now } }
          : view === "passes"
            ? { ...confirmed, endTime: { lt: now } }
            : { status: "CANCELLED" },
      include,
      orderBy: { startTime: view === "avenir" ? "asc" : "desc" },
      take: 100,
    }),
    db.eventType.count(),
    db.booking.groupBy({ by: ["phone"], where: { attended: false }, _count: true }),
  ]);

  const revenue = monthDone.reduce((sum, b) => sum + (b.eventType.price ?? 0), 0);
  const absences = new Map(noShows.map((n) => [n.phone, n._count]));

  // Group bookings by calendar day for a timeline view.
  const groups = new Map<string, BookingRow[]>();
  for (const b of bookings) {
    const key = formatInTimeZone(b.startTime, TIMEZONE, "yyyy-MM-dd");
    groups.set(key, [...(groups.get(key) ?? []), b]);
  }

  function reminder(b: BookingRow) {
    const place = b.address ?? b.eventType.location ?? settings.address;
    return [
      `Bonjour ${b.name},`,
      `Petit rappel de votre rendez-vous « ${b.eventType.title} » le ${formatDate(b.startTime).toLowerCase()} à ${formatTime(b.startTime)}.`,
      place ? `Lieu : ${place}.` : "",
      "Merci de répondre OUI pour confirmer votre présence.",
      `— ${settings.businessName}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{formatDate(now)}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-ink">Rendez-vous</h1>
        </div>
        <Link href="/admin/evenements" className="btn-ghost">
          <Plus className="size-4" /> Nouveau type de RDV
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Aujourd'hui" value={String(todayCount)} />
        <Stat label="7 prochains jours" value={String(weekCount)} />
        <Stat label="Acomptes à valider" value={String(toValidate.filter((b) => b.paymentRef).length)} highlight />
        <Stat label="Chiffre prévu du mois" value={formatFCFA(revenue)} small />
      </div>

      {toValidate.length > 0 && (
        <section className="card border-amber-300/60 p-5">
          <h2 className="flex items-center gap-2 font-semibold text-ink">
            <Wallet className="size-4.5 text-amber-600" /> Acomptes Mobile Money
          </h2>
          <ul className="mt-3 divide-y divide-line">
            {toValidate.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {b.name} · {formatFCFA(b.eventType.deposit ?? 0)}
                  </p>
                  <p className="text-sm text-muted">
                    {b.eventType.title} · {formatDate(b.startTime)} à {formatTime(b.startTime)}
                  </p>
                  {b.paymentRef ? (
                    <p className="mt-1 text-sm">
                      <span className="chip bg-amber-50 text-amber-800">
                        {mobileMoneyLabel(b.paymentMethod)} · {b.paymentRef}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted">
                      En attente du paiement, jusqu&apos;à{" "}
                      {formatTime(new Date(b.createdAt.getTime() + settings.pendingMinutes * 60_000))}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <ContactButtons phone={b.phone} />
                  {b.paymentRef && (
                    <form action={confirmPaymentAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="btn px-3 py-2">
                        <Check className="size-4" /> Paiement reçu
                      </button>
                    </form>
                  )}
                  <form action={rejectPaymentAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <ConfirmButton message={`Refuser et annuler la réservation de ${b.name} ?`} className="btn-danger">
                      Refuser
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Vérifiez la référence dans votre historique Wave, Orange Money, MTN ou Moov avant de valider.
          </p>
        </section>
      )}

      {next && view === "avenir" && (
        <div className="card flex flex-wrap items-center gap-4 border-blue/30 bg-gradient-to-r from-blue-soft to-surface p-5">
          <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-blue font-display text-base font-extrabold text-white tabular-nums">
            {formatTime(next.startTime)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-blue">Prochain rendez-vous</p>
            <p className="mt-0.5 font-semibold text-ink">
              {next.name} · {next.eventType.title}
            </p>
            <p className="text-sm text-muted">{formatDate(next.startTime)}</p>
          </div>
          <a href={whatsappUrl(next.phone, reminder(next))} target="_blank" rel="noopener" className="btn">
            <BellRing className="size-4" /> Rappel WhatsApp
          </a>
        </div>
      )}

      <div>
        <div className="flex gap-1 border-b border-line" role="tablist">
          {(Object.keys(VIEWS) as View[]).map((v) => (
            <Link
              key={v}
              href={v === "avenir" ? "/admin" : `/admin?vue=${v}`}
              role="tab"
              aria-selected={v === view}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                v === view ? "border-blue text-blue" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {VIEWS[v]}
            </Link>
          ))}
        </div>

        {bookings.length === 0 ? (
          <div className="card mt-6 flex flex-col items-center p-10 text-center">
            <CalendarDays className="size-10 text-blue/40" />
            <p className="mt-3 font-semibold text-ink">
              {view === "avenir" ? "Aucun rendez-vous à venir" : view === "passes" ? "Aucun rendez-vous passé" : "Aucune annulation"}
            </p>
            {view === "avenir" && (
              <p className="mt-1 max-w-sm text-sm text-muted">
                {eventTypeCount === 0
                  ? "Créez un type de rendez-vous, puis partagez son lien."
                  : "Partagez le lien de vos types de RDV sur WhatsApp, Facebook ou en statut."}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {[...groups].map(([day, list]) => (
              <section key={day}>
                <h2 className="eyebrow">{day === today ? "Aujourd'hui" : formatDate(list[0].startTime)}</h2>
                <ul className="card mt-2 divide-y divide-line">
                  {list.map((b) => {
                    const absent = absences.get(b.phone) ?? 0;
                    return (
                      <li
                        key={b.id}
                        className="flex flex-wrap items-start gap-x-4 gap-y-3 p-4 sm:flex-nowrap sm:items-center"
                      >
                        <div className="w-14 shrink-0 text-sm tabular-nums sm:w-20">
                          <p className="font-semibold text-ink">{formatTime(b.startTime)}</p>
                          <p className="text-muted">{formatTime(b.endTime)}</p>
                        </div>
                        <div className="min-w-0 flex-1 basis-[calc(100%-4.5rem)] sm:basis-auto">
                          <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                            {b.name}
                            {absent > 0 && (
                              <span className="chip bg-danger-soft text-danger" title="Absences passées">
                                {absent} absence{absent > 1 ? "s" : ""}
                              </span>
                            )}
                            {b.attended === true && <span className="chip bg-success-soft text-success">Venu</span>}
                          </p>
                          <p className="text-sm text-muted">
                            {b.eventType.title} · {formatPhone(b.phone)}
                            {b.eventType.price ? ` · ${formatFCFA(b.eventType.price)}` : ""}
                          </p>
                          {b.address && (
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate">
                              <Home className="size-3.5" /> {b.address}
                            </p>
                          )}
                          {b.notes && (
                            <p className="mt-1.5 rounded-lg bg-mist px-3 py-2 text-sm text-slate">{b.notes}</p>
                          )}
                          {b.status === "CANCELLED" && (
                            <p className="mt-1 text-xs text-danger">
                              Annulé par {b.cancelledBy === "visitor" ? "le client" : "vous"}
                            </p>
                          )}
                        </div>
                        <div className="flex w-full flex-wrap items-center justify-end gap-1 sm:w-auto sm:flex-nowrap">
                          {view === "avenir" && (
                            <a
                              href={whatsappUrl(b.phone, reminder(b))}
                              target="_blank"
                              rel="noopener"
                              className="btn-ghost px-2.5"
                              title="Envoyer un rappel WhatsApp"
                            >
                              <BellRing className="size-4" /> Rappel
                            </a>
                          )}
                          <ContactButtons phone={b.phone} />
                          {view === "passes" && (
                            <>
                              <AttendanceButton id={b.id} attended active={b.attended === true} />
                              <AttendanceButton id={b.id} attended={false} active={b.attended === false} />
                            </>
                          )}
                          {view === "avenir" && (
                            <form action={cancelBookingAction}>
                              <input type="hidden" name="id" value={b.id} />
                              <ConfirmButton
                                message={`Annuler le rendez-vous de ${b.name} ? Pensez à le prévenir.`}
                                className="btn-danger"
                              >
                                Annuler
                              </ConfirmButton>
                            </form>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight, small }: { label: string; value: string; highlight?: boolean; small?: boolean }) {
  return (
    <div className={`card p-4 sm:p-5 ${highlight && value !== "0" ? "border-amber-300 bg-amber-50" : ""}`}>
      <p className="text-xs text-muted sm:text-sm">{label}</p>
      <p
        className={`mt-1 font-display font-extrabold text-ink tabular-nums ${small ? "text-xl sm:text-2xl" : "text-3xl"}`}
      >
        {value}
      </p>
    </div>
  );
}

/** "Venu" / "Absent" toggle for past bookings. */
function AttendanceButton({ id, attended, active }: { id: string; attended: boolean; active: boolean }) {
  const Icon = attended ? UserCheck : UserX;
  const activeStyle = attended
    ? "border-success/40 bg-success-soft text-success"
    : "border-danger/40 bg-danger-soft text-danger";
  return (
    <form action={markAttendanceAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="attended" value={attended ? "1" : "0"} />
      <button aria-pressed={active} className={`btn-ghost px-2.5 ${active ? activeStyle : ""}`}>
        <Icon className="size-4" /> {attended ? "Venu" : "Absent"}
      </button>
    </form>
  );
}

function ContactButtons({ phone }: { phone: string }) {
  return (
    <>
      <a href={`tel:${phone}`} className="btn-ghost px-2.5" aria-label={`Appeler ${formatPhone(phone)}`} title="Appeler">
        <Phone className="size-4" />
      </a>
      <a
        href={whatsappUrl(phone)}
        target="_blank"
        rel="noopener"
        className="btn-ghost px-2.5"
        aria-label={`WhatsApp ${formatPhone(phone)}`}
        title="WhatsApp"
      >
        <MessageCircle className="size-4" />
      </a>
    </>
  );
}
