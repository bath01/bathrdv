import "server-only";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { addDaysToDate, todayInZone, weekdayOf, zonedToUtc } from "@/lib/time";

/**
 * Bookings that hold their slot: confirmed ones, and pending ones that are paid
 * (reference sent) or still inside the payment delay.
 */
export function holdsSlot(pendingMinutes: number) {
  return {
    OR: [
      { status: "CONFIRMED" as const },
      {
        status: "PENDING" as const,
        OR: [
          { paymentRef: { not: null } },
          { createdAt: { gt: new Date(Date.now() - pendingMinutes * 60_000) } },
        ],
      },
    ],
  };
}

/** True when the date is between today and the end of the booking window. */
export async function isBookableDate(date: string) {
  const { bookingWindowDays } = await getSettings();
  const today = todayInZone();
  if (date < today || date > addDaysToDate(today, bookingWindowDays)) return false;
  const blocked = await db.blockedDate.findUnique({ where: { date } });
  return !blocked;
}

/**
 * Free start times for one event type on one calendar day.
 * Same idea as Cal.com: opening hours minus bookings (plus buffer) minus minimum notice.
 */
export async function getAvailableSlots(eventTypeId: string, date: string) {
  const eventType = await db.eventType.findUnique({ where: { id: eventTypeId } });
  if (!eventType || !eventType.active) return [];
  if (!(await isBookableDate(date))) return [];

  const ranges = await db.availability.findMany({
    where: { weekday: weekdayOf(date) },
    orderBy: { startTime: "asc" },
  });
  if (ranges.length === 0) return [];

  const { minNoticeHours, bufferMinutes, pendingMinutes } = await getSettings();
  const durationMs = eventType.duration * 60_000;
  // Start times every 30 min (or every `duration` for short meetings): 09:00, 09:30, 10:00…
  const stepMs = Math.min(eventType.duration, 30) * 60_000;
  const bufferMs = bufferMinutes * 60_000;
  const dayStart = zonedToUtc(date, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60_000);

  // Any confirmed booking blocks the slot, whatever its event type: one person, one agenda.
  const bookings = await db.booking.findMany({
    where: {
      ...holdsSlot(pendingMinutes),
      startTime: { lt: new Date(dayEnd.getTime() + bufferMs) },
      endTime: { gt: new Date(dayStart.getTime() - bufferMs) },
    },
    select: { startTime: true, endTime: true },
  });

  const earliest = Date.now() + minNoticeHours * 60 * 60_000;
  const slots: Date[] = [];

  for (const range of ranges) {
    const rangeEnd = zonedToUtc(date, range.endTime).getTime();
    let start = zonedToUtc(date, range.startTime).getTime();

    while (start + durationMs <= rangeEnd) {
      const end = start + durationMs;
      // Keep the buffer free on both sides of every existing booking.
      const overlaps = bookings.some(
        (b) => b.startTime.getTime() < end + bufferMs && b.endTime.getTime() + bufferMs > start,
      );
      if (start >= earliest && !overlaps) slots.push(new Date(start));
      start += stepMs;
    }
  }

  return slots;
}

/** Calendar days that can have slots: open weekday, inside window, not blocked. */
export async function getOpenDates() {
  const { bookingWindowDays } = await getSettings();
  const [openDays, blocked] = await Promise.all([
    db.availability.findMany({ select: { weekday: true }, distinct: ["weekday"] }),
    db.blockedDate.findMany({ select: { date: true } }),
  ]);
  const weekdays = new Set(openDays.map((d) => d.weekday));
  const blockedSet = new Set(blocked.map((b) => b.date));
  const today = todayInZone();

  const dates: string[] = [];
  for (let i = 0; i <= bookingWindowDays; i++) {
    const d = addDaysToDate(today, i);
    if (weekdays.has(weekdayOf(d)) && !blockedSet.has(d)) dates.push(d);
  }
  return dates;
}
