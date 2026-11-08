import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { fr } from "date-fns/locale";

export const TIMEZONE = process.env.APP_TIMEZONE || "Africa/Abidjan";

export const WEEKDAYS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

/** "2026-11-09" + "09:30" in TIMEZONE -> UTC Date */
export function zonedToUtc(date: string, time: string) {
  return fromZonedTime(`${date}T${time}:00`, TIMEZONE);
}

/** Weekday (0 = Sunday) of a "YYYY-MM-DD" calendar date. */
export function weekdayOf(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Today's date as "YYYY-MM-DD" in TIMEZONE. */
export function todayInZone() {
  return formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd");
}

/** Add days to a "YYYY-MM-DD" date. */
export function addDaysToDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatTime(date: Date) {
  return formatInTimeZone(date, TIMEZONE, "HH:mm");
}

/** "Lundi 9 novembre 2026": capital first letter only, as in French. */
export function formatDate(date: Date) {
  const text = formatInTimeZone(date, TIMEZONE, "EEEE d MMMM yyyy", { locale: fr });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDateTime(date: Date) {
  return `${formatDate(date)} à ${formatTime(date)}`;
}

export function isValidDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));
}

export function isValidTime(time: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}
