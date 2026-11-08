import {
  CalendarDays,
  CalendarPlus,
  Check,
  Clock,
  Download,
  Home,
  Hourglass,
  MapPin,
  MessageCircle,
  User,
  Wallet,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelByVisitorAction } from "@/app/actions";
import { Logo } from "@/components/Logo";
import { ConfirmButton } from "@/components/ui";
import { googleCalendarUrl, whatsappUrl } from "@/lib/calendar-links";
import { acceptedMobileMoney, formatFCFA, mobileMoneyLabel } from "@/lib/ci";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatDate, formatTime } from "@/lib/time";
import { PaymentForm } from "./PaymentForm";

export const metadata: Metadata = { title: "Votre rendez-vous", robots: { index: false } };

// Booking page for the visitor. The random token in the URL is the only key.
export default async function ReservationPage({ params, searchParams }: PageProps<"/reservation/[token]">) {
  const { token } = await params;
  const isNew = (await searchParams).nouveau === "1";
  const [booking, settings] = await Promise.all([
    db.booking.findUnique({ where: { token }, include: { eventType: true } }),
    getSettings(),
  ]);
  if (!booking) notFound();

  const { eventType } = booking;
  const cancelled = booking.status === "CANCELLED";
  const pending = booking.status === "PENDING";
  const awaitingPayment = pending && !booking.paymentRef;
  const past = booking.startTime < new Date();
  const when = `${formatDate(booking.startTime)} à ${formatTime(booking.startTime)}`;
  const location = booking.address ?? eventType.location ?? (settings.address || null);
  const deadline = new Date(booking.createdAt.getTime() + settings.pendingMinutes * 60_000);

  const title = cancelled
    ? "Rendez-vous annulé"
    : awaitingPayment
      ? "Créneau réservé, acompte à payer"
      : pending
        ? "Paiement en cours de vérification"
        : isNew
          ? "C'est confirmé !"
          : "Votre rendez-vous";

  const subtitle = cancelled
    ? "Ce créneau est de nouveau libre."
    : awaitingPayment
      ? `Payez l'acompte avant ${formatTime(deadline)}, sinon le créneau sera libéré.`
      : pending
        ? "Nous vérifions votre paiement. Votre rendez-vous sera confirmé très vite."
        : past
          ? "Ce rendez-vous est passé."
          : "Gardez cette page : elle permet de retrouver ou d'annuler votre rendez-vous.";

  // Prefilled WhatsApp message to the business, with all the details.
  const whatsappText = [
    `Bonjour, j'ai réservé : ${eventType.title}`,
    `📅 ${when}`,
    `👤 ${booking.name}`,
    booking.address ? `📍 ${booking.address}` : "",
    booking.paymentRef ? `💳 ${mobileMoneyLabel(booking.paymentMethod)} : ${booking.paymentRef}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto w-full max-w-xl px-4 py-5 sm:px-6">
        <Logo />
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 sm:px-6">
        <div className="card animate-rise p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div
              className={`grid size-12 shrink-0 place-items-center rounded-full ${
                cancelled
                  ? "bg-danger-soft text-danger"
                  : pending
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue text-white shadow-lg shadow-blue/30"
              }`}
            >
              {cancelled ? (
                <X className="size-6" />
              ) : pending ? (
                <Hourglass className="size-6" />
              ) : (
                <Check className="size-6" strokeWidth={3} />
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-ink">{title}</h1>
              <p className="mt-1 text-sm text-muted">{subtitle}</p>
            </div>
          </div>

          <dl className={`mt-6 space-y-3 rounded-xl bg-mist p-4 text-sm ${cancelled ? "opacity-60" : ""}`}>
            <Row icon={<CalendarDays className="size-4" />} label="Rendez-vous" value={eventType.title} />
            <Row
              icon={<Clock className="size-4" />}
              label="Date"
              value={`${formatDate(booking.startTime)}, ${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`}
            />
            {location && (
              <Row
                icon={booking.address ? <Home className="size-4" /> : <MapPin className="size-4" />}
                label={booking.address ? "Adresse" : "Lieu"}
                value={location}
              />
            )}
            <Row icon={<User className="size-4" />} label="Au nom de" value={booking.name} />
            {eventType.price && (
              <Row
                icon={<Wallet className="size-4" />}
                label="Prix"
                value={
                  eventType.deposit
                    ? `${formatFCFA(eventType.price)} (acompte ${formatFCFA(eventType.deposit)}, reste ${formatFCFA(eventType.price - eventType.deposit)} sur place)`
                    : `${formatFCFA(eventType.price)}, à régler sur place`
                }
              />
            )}
          </dl>

          {awaitingPayment && eventType.deposit && !past && (
            <section className="mt-6 border-t border-line pt-6">
              <h2 className="font-semibold text-ink">Payer l&apos;acompte de {formatFCFA(eventType.deposit)}</h2>
              <PaymentForm
                token={booking.token}
                amount={formatFCFA(eventType.deposit)}
                providers={acceptedMobileMoney(settings).map(({ id, label, color, number }) => ({ id, label, color, number }))}
              />
            </section>
          )}

          {pending && booking.paymentRef && (
            <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              Référence reçue : <strong>{booking.paymentRef}</strong> ({mobileMoneyLabel(booking.paymentMethod)}).
            </p>
          )}

          {!cancelled && !past && (
            <>
              {!pending && (
                <>
                  <p className="eyebrow mt-6">Ajouter à mon agenda</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <a
                      className="btn-ghost"
                      target="_blank"
                      rel="noopener"
                      href={googleCalendarUrl({
                        title: eventType.title,
                        start: booking.startTime,
                        end: booking.endTime,
                        location,
                      })}
                    >
                      <CalendarPlus className="size-4" /> Google Agenda
                    </a>
                    <a className="btn-ghost" href={`/reservation/${booking.token}/ics`}>
                      <Download className="size-4" /> iPhone / Outlook
                    </a>
                  </div>
                </>
              )}

              {settings.phone && (
                <a
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-95"
                  target="_blank"
                  rel="noopener"
                  href={whatsappUrl(settings.phone, whatsappText)}
                >
                  <MessageCircle className="size-4" />
                  {booking.paymentRef ? "Envoyer la preuve de paiement sur WhatsApp" : "Envoyer le récapitulatif sur WhatsApp"}
                </a>
              )}

              <div className="mt-6 flex justify-end border-t border-line pt-5">
                <form action={cancelByVisitorAction}>
                  <input type="hidden" name="token" value={booking.token} />
                  <ConfirmButton message="Annuler ce rendez-vous ? Le créneau sera libéré." className="btn-danger">
                    Annuler le rendez-vous
                  </ConfirmButton>
                </form>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-blue hover:underline">
            {cancelled ? "Choisir un nouveau créneau" : "Retour à l'accueil"}
          </Link>
        </div>
      </main>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted">{icon}</span>
      <dt className="w-24 shrink-0 text-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
