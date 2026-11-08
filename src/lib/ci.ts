// Côte d'Ivoire specifics: money, Mobile Money, communes, public holidays.
// No server-only import: client components use these too.

const fcfa = new Intl.NumberFormat("fr-FR");

/** 15000 -> "15 000 FCFA" */
export function formatFCFA(amount: number) {
  return `${fcfa.format(amount)} FCFA`;
}

export const MOBILE_MONEY = [
  { id: "wave", label: "Wave", setting: "waveNumber", color: "#1DC8F2" },
  { id: "orange", label: "Orange Money", setting: "orangeMoneyNumber", color: "#FF7900" },
  { id: "mtn", label: "MTN MoMo", setting: "mtnMoneyNumber", color: "#FFCB05" },
  { id: "moov", label: "Moov Money", setting: "moovMoneyNumber", color: "#0066B3" },
] as const;

export type MobileMoneyId = (typeof MOBILE_MONEY)[number]["id"];
export type MobileMoneySettings = Record<(typeof MOBILE_MONEY)[number]["setting"], string | null>;

/** Providers the business accepts, with their number. */
export function acceptedMobileMoney(settings: MobileMoneySettings) {
  return MOBILE_MONEY.flatMap((m) => {
    const number = settings[m.setting];
    return number ? [{ ...m, number }] : [];
  });
}

export function mobileMoneyLabel(id: string | null) {
  return MOBILE_MONEY.find((m) => m.id === id)?.label ?? id ?? "";
}

export const ABIDJAN_COMMUNES = [
  "Abobo",
  "Adjamé",
  "Anyama",
  "Attécoubé",
  "Bingerville",
  "Cocody",
  "Koumassi",
  "Marcory",
  "Plateau",
  "Port-Bouët",
  "Songon",
  "Treichville",
  "Yopougon",
];

/** Easter Sunday (Gregorian), "YYYY-MM-DD". */
function easter(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function shift(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Ivorian public holidays with a fixed or computable date.
 * Muslim holidays (Korité, Tabaski, Maouloud, Nuit du Destin) depend on the moon
 * and are set by decree each year: add them by hand in "Jours fermés".
 */
export function ivorianHolidays(year: number) {
  const e = easter(year);
  return [
    { date: `${year}-01-01`, reason: "Jour de l'an" },
    { date: shift(e, 1), reason: "Lundi de Pâques" },
    { date: `${year}-05-01`, reason: "Fête du Travail" },
    { date: shift(e, 39), reason: "Ascension" },
    { date: shift(e, 50), reason: "Lundi de Pentecôte" },
    { date: `${year}-08-07`, reason: "Fête de l'Indépendance" },
    { date: `${year}-08-15`, reason: "Assomption" },
    { date: `${year}-11-01`, reason: "Toussaint" },
    { date: `${year}-11-15`, reason: "Journée nationale de la Paix" },
    { date: `${year}-12-25`, reason: "Noël" },
  ];
}
