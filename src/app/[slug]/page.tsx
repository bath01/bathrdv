import { ArrowLeft, Clock, Globe, Home, MapPin, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { formatFCFA } from "@/lib/ci";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getOpenDates } from "@/lib/slots";
import { TIMEZONE, todayInZone } from "@/lib/time";
import { BookingFlow } from "./BookingFlow";

async function getEventType(slug: string) {
  const eventType = await db.eventType.findUnique({ where: { slug } });
  return eventType?.active ? eventType : null;
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const eventType = await getEventType((await params).slug);
  return { title: eventType?.title ?? "Rendez-vous" };
}

export default async function BookingPage({ params }: PageProps<"/[slug]">) {
  const eventType = await getEventType((await params).slug);
  if (!eventType) notFound();

  const [openDates, settings] = await Promise.all([getOpenDates(), getSettings()]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <Link href="/" className="btn-ghost">
          <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Tous les rendez-vous</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
        <div className="card grid animate-rise overflow-hidden md:grid-cols-[300px_1fr]">
          <aside className="border-b border-line bg-gradient-to-b from-blue-soft/60 to-transparent p-6 md:border-r md:border-b-0">
            <p className="eyebrow">Réservation</p>
            <h1 className="mt-2 font-display text-2xl leading-tight font-extrabold text-ink">{eventType.title}</h1>
            <ul className="mt-4 space-y-2.5 text-sm text-slate">
              <li className="flex items-center gap-2.5">
                <Clock className="size-4 text-muted" /> {eventType.duration} minutes
              </li>
              {eventType.atHome ? (
                <li className="flex items-center gap-2.5">
                  <Home className="size-4 text-muted" /> À votre domicile
                </li>
              ) : (
                eventType.location && (
                  <li className="flex items-center gap-2.5">
                    <MapPin className="size-4 text-muted" /> {eventType.location}
                  </li>
                )
              )}
              <li className="flex items-center gap-2.5 font-semibold text-blue">
                <Wallet className="size-4" /> {eventType.price ? formatFCFA(eventType.price) : "Gratuit"}
              </li>
              <li className="flex items-center gap-2.5">
                <Globe className="size-4 text-muted" /> Heure de {TIMEZONE.split("/")[1]?.replace("_", " ")}
              </li>
            </ul>
            {eventType.deposit && (
              <p className="mt-4 rounded-xl bg-surface p-3 text-xs leading-relaxed text-slate ring-1 ring-line">
                Un acompte de <strong>{formatFCFA(eventType.deposit)}</strong> par Mobile Money confirme la
                réservation. Vous avez {settings.pendingMinutes} min pour le payer.
              </p>
            )}
            {eventType.description && (
              <p className="mt-5 border-t border-line pt-5 text-sm leading-relaxed text-muted">
                {eventType.description}
              </p>
            )}
          </aside>

          <BookingFlow
            eventTypeId={eventType.id}
            duration={eventType.duration}
            atHome={eventType.atHome}
            deposit={eventType.deposit}
            openDates={openDates}
            today={todayInZone()}
            timezone={TIMEZONE}
          />
        </div>
      </main>
    </div>
  );
}
