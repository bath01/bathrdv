import { Clock, ExternalLink, Eye, EyeOff, Home, MapPin, Pencil, Trash2, Wallet } from "lucide-react";
import { ConfirmButton, CopyLinkButton } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatFCFA } from "@/lib/ci";
import { db } from "@/lib/db";
import { deleteEventTypeAction, toggleEventTypeAction } from "../actions";
import { EventTypeForm } from "./EventTypeForm";

export default async function EventTypesPage() {
  await requireAdmin();
  const eventTypes = await db.eventType.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { bookings: { where: { status: "CONFIRMED" } } } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Types de rendez-vous</h1>
        <p className="mt-1 text-sm text-muted">
          Chaque type a son propre lien. Partagez-le pour recevoir des réservations.
        </p>
      </div>

      <div className="space-y-3">
        {eventTypes.map((e) => (
          <article key={e.id} className={`card overflow-hidden ${e.active ? "" : "bg-mist/60"}`}>
            <div className="flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-ink">{e.title}</h2>
                  {!e.active && <span className="chip">Masqué</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="chip">
                    <Clock className="size-3.5" /> {e.duration} min
                  </span>
                  {e.atHome ? (
                    <span className="chip">
                      <Home className="size-3.5" /> À domicile
                    </span>
                  ) : (
                    e.location && (
                      <span className="chip">
                        <MapPin className="size-3.5" /> {e.location}
                      </span>
                    )
                  )}
                  <span className="chip">{e.price ? formatFCFA(e.price) : "Gratuit"}</span>
                  {e.deposit && (
                    <span className="chip">
                      <Wallet className="size-3.5" /> Acompte {formatFCFA(e.deposit)}
                    </span>
                  )}
                  <a href={`/${e.slug}`} target="_blank" className="chip text-blue hover:bg-blue-soft">
                    /{e.slug} <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <CopyLinkButton path={`/${e.slug}`} />
                <form action={toggleEventTypeAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <button className="btn-ghost px-2.5" title={e.active ? "Masquer" : "Afficher"}>
                    {e.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    <span className="sr-only">{e.active ? "Masquer" : "Afficher"}</span>
                  </button>
                </form>
                <form action={deleteEventTypeAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <ConfirmButton
                    message={
                      e._count.bookings > 0
                        ? `Supprimer « ${e.title} » et ses ${e._count.bookings} rendez-vous ? Action définitive.`
                        : `Supprimer « ${e.title} » ? Action définitive.`
                    }
                    className="btn-danger px-2.5"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Supprimer</span>
                  </ConfirmButton>
                </form>
              </div>
            </div>
            <details className="group border-t border-line">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 text-sm font-medium text-slate hover:bg-mist">
                <Pencil className="size-4" /> Modifier
              </summary>
              <div className="px-5 pt-2 pb-5">
                <EventTypeForm initial={e} />
              </div>
            </details>
          </article>
        ))}

        {eventTypes.length === 0 && (
          <div className="card p-6 text-sm text-muted">
            Aucun type de rendez-vous. Créez le premier ci-dessous.
          </div>
        )}
      </div>

      <section className="card p-6">
        <h2 className="font-semibold text-ink">Nouveau type de rendez-vous</h2>
        <div className="mt-4">
          <EventTypeForm />
        </div>
      </section>
    </div>
  );
}
