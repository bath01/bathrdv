import { ArrowRight, CalendarCheck, Clock, Home as HomeIcon, MapPin, MessageCircle, Phone, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Logo, Swoosh } from "@/components/Logo";
import { formatPhone, whatsappUrl } from "@/lib/calendar-links";
import { formatFCFA } from "@/lib/ci";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

// Public home page: the meetings visitors can book.
export default async function Home() {
  // Render on every request: event types and settings change from the admin.
  await connection();
  const [eventTypes, settings] = await Promise.all([
    db.eventType.findMany({ where: { active: true }, orderBy: { duration: "asc" } }),
    getSettings(),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        {settings.phone && (
          <a href={`tel:${settings.phone}`} className="btn-ghost hidden sm:inline-flex">
            <Phone className="size-4" /> {formatPhone(settings.phone)}
          </a>
        )}
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-4 pt-6 pb-16 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:pt-14">
        <section className="animate-rise">
          <p className="eyebrow">Prise de rendez-vous en ligne</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-ink sm:text-5xl">
            Choisissez votre créneau,
            <span className="relative mt-1 block w-fit text-blue">
              on s&apos;occupe du reste.
              <Swoosh className="absolute -bottom-3 left-0 h-3 w-full" />
            </span>
          </h1>
          <p className="mt-8 max-w-md text-base text-muted">
            Plus besoin d&apos;appeler ni d&apos;attendre : voyez les heures libres et réservez
            en moins d&apos;une minute, depuis votre téléphone.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate">
            <li className="flex items-center gap-3">
              <CalendarCheck className="size-5 text-blue" /> Confirmation immédiate, rappel sur WhatsApp
            </li>
            <li className="flex items-center gap-3">
              <Wallet className="size-5 text-blue" /> Acompte par Wave, Orange Money, MTN ou Moov
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-blue" /> Annulation possible depuis votre lien
            </li>
          </ul>
        </section>

        <section aria-labelledby="types" className="animate-rise [animation-delay:80ms]">
          <h2 id="types" className="eyebrow">
            {eventTypes.length > 1 ? "Quel rendez-vous ?" : "Rendez-vous disponible"}
          </h2>
          <div className="mt-3 space-y-3">
            {eventTypes.map((e) => (
              <Link
                key={e.id}
                href={`/${e.slug}`}
                className="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-blue/40"
              >
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-soft text-blue">
                  <span className="font-display text-sm font-extrabold">{e.duration}′</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{e.title}</p>
                  {e.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{e.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="chip">
                      <Clock className="size-3.5" /> {e.duration} min
                    </span>
                    {e.atHome ? (
                      <span className="chip">
                        <HomeIcon className="size-3.5" /> À domicile
                      </span>
                    ) : (
                      e.location && (
                        <span className="chip">
                          <MapPin className="size-3.5" /> {e.location}
                        </span>
                      )
                    )}
                    <span className="chip bg-blue-soft text-blue">{e.price ? formatFCFA(e.price) : "Gratuit"}</span>
                    {e.deposit && (
                      <span className="chip">
                        <Wallet className="size-3.5" /> Acompte {formatFCFA(e.deposit)}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="size-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-blue" />
              </Link>
            ))}

            {eventTypes.length === 0 && (
              <div className="card p-6 text-sm text-muted">
                Aucun rendez-vous n&apos;est ouvert à la réservation pour le moment. Revenez bientôt.
              </div>
            )}
          </div>

          {settings.phone && (
            <a
              href={whatsappUrl(settings.phone, "Bonjour, j'ai une question sur les rendez-vous.")}
              target="_blank"
              rel="noopener"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate hover:text-blue"
            >
              <MessageCircle className="size-4" /> Une question ? Écrivez-nous sur WhatsApp
            </a>
          )}
        </section>
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} {settings.businessName}
      </footer>
    </div>
  );
}
