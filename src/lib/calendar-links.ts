// "Add to my calendar" helpers for the confirmation page.

type CalEvent = { title: string; start: Date; end: Date; details?: string; location?: string | null };

/** 20261109T090000Z */
function stamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(e: CalEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${stamp(e.start)}/${stamp(e.end)}`,
    details: e.details ?? "",
    location: e.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function escapeIcs(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);
}

/** iCalendar file content, works with Apple Calendar, Outlook and most phones. */
export function icsFile(e: CalEvent & { uid: string }) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BATHRDV//FR",
    "BEGIN:VEVENT",
    `UID:${e.uid}@bathrdv`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SUMMARY:${escapeIcs(e.title)}`,
    e.details ? `DESCRIPTION:${escapeIcs(e.details)}` : "",
    e.location ? `LOCATION:${escapeIcs(e.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/** wa.me link: digits only, with country code. */
export function whatsappUrl(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** "+2250707070707" -> "+225 07 07 07 07 07". Other formats are returned as is. */
export function formatPhone(phone: string) {
  const ci = phone.match(/^\+225(\d{10})$/);
  if (!ci) return phone;
  return `+225 ${ci[1].replace(/(\d{2})(?=\d)/g, "$1 ")}`;
}
