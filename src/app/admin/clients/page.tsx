import { MessageCircle, Phone, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatPhone, whatsappUrl } from "@/lib/calendar-links";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/time";

// Client file built from bookings: one line per phone number.
export default async function ClientsPage({ searchParams }: PageProps<"/admin/clients">) {
  await requireAdmin();
  const q = (await searchParams).q;
  const search = typeof q === "string" ? q.trim() : "";

  const bookings = await db.booking.findMany({
    where: search
      ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { phone: { contains: search.replace(/\s/g, "") } }] }
      : {},
    orderBy: { startTime: "desc" },
    select: { name: true, phone: true, startTime: true, status: true, attended: true },
  });

  const now = new Date();
  const clients = new Map<
    string,
    { name: string; phone: string; total: number; absences: number; cancelled: number; last?: Date; next?: Date }
  >();
  for (const b of bookings) {
    const c = clients.get(b.phone) ?? { name: b.name, phone: b.phone, total: 0, absences: 0, cancelled: 0 };
    if (b.status === "CANCELLED") c.cancelled++;
    else {
      c.total++;
      if (b.attended === false) c.absences++;
      if (b.startTime < now && (!c.last || b.startTime > c.last)) c.last = b.startTime;
      if (b.startTime >= now && (!c.next || b.startTime < c.next)) c.next = b.startTime;
    }
    clients.set(b.phone, c);
  }
  const list = [...clients.values()].sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Clients</h1>
          <p className="mt-1 text-sm text-muted">
            {list.length} client{list.length > 1 ? "s" : ""}. Repérez les fidèles et ceux qui ne viennent pas.
          </p>
        </div>
        <form className="w-full sm:w-72">
          <input
            name="q"
            defaultValue={search}
            type="search"
            placeholder="Rechercher un nom ou un numéro"
            aria-label="Rechercher un client"
            className="input"
          />
        </form>
      </div>

      {list.length === 0 ? (
        <div className="card flex flex-col items-center p-10 text-center">
          <Users className="size-10 text-blue/40" />
          <p className="mt-3 font-semibold text-ink">{search ? "Aucun client trouvé" : "Pas encore de clients"}</p>
          <p className="mt-1 text-sm text-muted">Les clients apparaissent ici après leur première réservation.</p>
        </div>
      ) : (
        <>
        {/* Phones: one card per client */}
        <ul className="space-y-3 md:hidden">
          {list.map((c) => (
            <li key={c.phone} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    {c.name}
                    {c.total >= 3 && c.absences === 0 && (
                      <span className="chip ml-2 bg-success-soft text-success">Fidèle</span>
                    )}
                  </p>
                  <p className="text-sm text-muted">{formatPhone(c.phone)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <a href={`tel:${c.phone}`} className="btn-ghost px-2.5" aria-label={`Appeler ${c.name}`}>
                    <Phone className="size-4" />
                  </a>
                  <a
                    href={whatsappUrl(c.phone)}
                    target="_blank"
                    rel="noopener"
                    className="btn-ghost px-2.5"
                    aria-label={`WhatsApp ${c.name}`}
                  >
                    <MessageCircle className="size-4" />
                  </a>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-mist p-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">RDV</dt>
                  <dd className="font-semibold text-ink tabular-nums">{c.total}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Absences</dt>
                  <dd className={`font-semibold tabular-nums ${c.absences > 0 ? "text-danger" : "text-ink"}`}>
                    {c.absences}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Dernière visite</dt>
                  <dd className="text-slate">{c.last ? formatDate(c.last) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Prochain RDV</dt>
                  <dd className="text-slate">{c.next ? formatDate(c.next) : "—"}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>

        {/* Tablets and computers: table */}
        <div className="card hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">RDV</th>
                <th className="px-4 py-3 font-semibold">Absences</th>
                <th className="px-4 py-3 font-semibold">Dernière visite</th>
                <th className="px-4 py-3 font-semibold">Prochain RDV</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((c) => (
                <tr key={c.phone}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">
                      {c.name}
                      {c.total >= 3 && c.absences === 0 && <span className="chip ml-2 bg-success-soft text-success">Fidèle</span>}
                    </p>
                    <p className="text-muted">{formatPhone(c.phone)}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{c.total}</td>
                  <td className="px-4 py-3">
                    {c.absences > 0 ? (
                      <span className="chip bg-danger-soft text-danger">{c.absences}</span>
                    ) : (
                      <span className="text-muted">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{c.last ? formatDate(c.last) : "—"}</td>
                  <td className="px-4 py-3 text-muted">{c.next ? formatDate(c.next) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <a href={`tel:${c.phone}`} className="btn-ghost px-2.5" title="Appeler">
                        <Phone className="size-4" />
                      </a>
                      <a href={whatsappUrl(c.phone)} target="_blank" rel="noopener" className="btn-ghost px-2.5" title="WhatsApp">
                        <MessageCircle className="size-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
