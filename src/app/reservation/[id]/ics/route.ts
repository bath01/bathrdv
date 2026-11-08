import { icsFile } from "@/lib/calendar-links";
import { db } from "@/lib/db";

// Downloads the booking as an .ics file for Apple Calendar, Outlook, phones.
export async function GET(_req: Request, ctx: RouteContext<"/reservation/[id]/ics">) {
  const { id } = await ctx.params;
  const booking = await db.booking.findUnique({ where: { id }, include: { eventType: true } });
  if (!booking || booking.status !== "CONFIRMED") return new Response("Introuvable", { status: 404 });

  const body = icsFile({
    uid: booking.id,
    title: booking.eventType.title,
    start: booking.startTime,
    end: booking.endTime,
    location: booking.eventType.location,
    details: "Rendez-vous réservé avec BATHRDV",
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="rendez-vous.ics"`,
    },
  });
}
