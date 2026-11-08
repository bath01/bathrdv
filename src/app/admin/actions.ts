"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkPassword, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ivorianHolidays } from "@/lib/ci";
import { isValidDate, isValidTime, todayInZone } from "@/lib/time";

// Admin server actions. Every action checks the session first:
// server actions are reachable by direct POST, not only through the UI.

export type FormState = { error?: string; ok?: boolean };

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) return { error: "Mot de passe incorrect." };
  await createSession();
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

// ---------- Event types ----------

// Slugs used by app routes cannot be event type slugs.
const RESERVED_SLUGS = ["admin", "login", "reservation", "api", "icon.png", "logo.png"];

const eventTypeSchema = z.object({
  title: z.string().trim().min(2, "Le titre doit faire au moins 2 caractères.").max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Le lien accepte seulement des lettres, chiffres et tirets.")
    .refine((s) => !RESERVED_SLUGS.includes(s), "Ce lien est réservé. Choisissez-en un autre."),
  description: z.string().trim().max(500).optional(),
  location: z.string().trim().max(200).optional(),
  duration: z.coerce.number().int().min(5, "Durée minimum : 5 min.").max(480),
  // Empty field = free / no deposit.
  price: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(0).max(10_000_000).optional()),
  deposit: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(0).max(10_000_000).optional()),
  atHome: z.preprocess((v) => v === "on", z.boolean()),
});

export async function saveEventTypeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = eventTypeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const sameSlug = await db.eventType.findUnique({ where: { slug: parsed.data.slug } });
  if (sameSlug && sameSlug.id !== id) return { error: "Ce lien est déjà utilisé par un autre type." };

  if (parsed.data.deposit && parsed.data.price && parsed.data.deposit > parsed.data.price) {
    return { error: "L'acompte ne peut pas dépasser le prix." };
  }
  const data = {
    ...parsed.data,
    description: parsed.data.description || null,
    location: parsed.data.location || null,
    price: parsed.data.price || null,
    deposit: parsed.data.deposit || null,
  };
  if (id) await db.eventType.update({ where: { id }, data });
  else await db.eventType.create({ data });

  revalidatePath("/admin/evenements");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleEventTypeAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const eventType = await db.eventType.findUnique({ where: { id } });
  if (!eventType) return;
  await db.eventType.update({ where: { id }, data: { active: !eventType.active } });
  revalidatePath("/admin/evenements");
  revalidatePath("/");
}

export async function deleteEventTypeAction(formData: FormData) {
  await requireAdmin();
  await db.eventType.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/evenements");
  revalidatePath("/");
}

// ---------- Availability ----------

/**
 * Replaces the whole weekly schedule.
 * Form fields per day N: day-N-on, day-N-start, day-N-end,
 * and for a lunch break: day-N-break, day-N-bstart, day-N-bend.
 */
export async function saveAvailabilityAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const rows: { weekday: number; startTime: string; endTime: string }[] = [];
  const field = (weekday: number, name: string) => String(formData.get(`day-${weekday}-${name}`) ?? "");

  for (let weekday = 0; weekday < 7; weekday++) {
    if (field(weekday, "on") !== "on") continue;
    const times = [field(weekday, "start")];
    if (field(weekday, "break") === "on") times.push(field(weekday, "bstart"), field(weekday, "bend"));
    times.push(field(weekday, "end"));

    // Times must be valid and strictly increasing: start < pause < reprise < end.
    const ordered = times.every((t, i) => isValidTime(t) && (i === 0 || times[i - 1] < t));
    if (!ordered) {
      return { error: "Vérifiez les heures : début, pause, reprise et fin doivent se suivre." };
    }
    for (let i = 0; i < times.length; i += 2) {
      rows.push({ weekday, startTime: times[i], endTime: times[i + 1] });
    }
  }

  await db.$transaction([db.availability.deleteMany(), db.availability.createMany({ data: rows })]);
  revalidatePath("/admin/disponibilites");
  return { ok: true };
}

export async function addBlockedDateAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const date = String(formData.get("date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 100);
  if (!isValidDate(date)) return { error: "Choisissez une date." };
  await db.blockedDate.upsert({
    where: { date },
    update: { reason: reason || null },
    create: { date, reason: reason || null },
  });
  revalidatePath("/admin/disponibilites");
  return { ok: true };
}

/** Adds this year's and next year's fixed Ivorian public holidays. */
export async function importHolidaysAction(): Promise<FormState> {
  await requireAdmin();
  const today = todayInZone();
  const year = Number(today.slice(0, 4));
  const holidays = [...ivorianHolidays(year), ...ivorianHolidays(year + 1)].filter((h) => h.date >= today);
  await db.blockedDate.createMany({ data: holidays, skipDuplicates: true });
  revalidatePath("/admin/disponibilites");
  return { ok: true };
}

export async function removeBlockedDateAction(formData: FormData) {
  await requireAdmin();
  await db.blockedDate.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/disponibilites");
}

// ---------- Settings ----------

const settingsSchema = z.object({
  businessName: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(200).optional(),
  waveNumber: z.string().trim().max(30).optional(),
  orangeMoneyNumber: z.string().trim().max(30).optional(),
  mtnMoneyNumber: z.string().trim().max(30).optional(),
  moovMoneyNumber: z.string().trim().max(30).optional(),
  pendingMinutes: z.coerce.number().int().min(10).max(1440),
  minNoticeHours: z.coerce.number().int().min(0).max(168),
  bufferMinutes: z.coerce.number().int().min(0).max(120),
  bookingWindowDays: z.coerce.number().int().min(1).max(365),
});

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Vérifiez les valeurs saisies." };
  // Empty text fields are stored as null.
  const data = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v === "" ? null : v]),
  ) as typeof parsed.data;
  await db.settings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------- Bookings ----------

export async function cancelBookingAction(formData: FormData) {
  await requireAdmin();
  await db.booking.update({
    where: { id: String(formData.get("id")) },
    data: { status: "CANCELLED", cancelledBy: "admin" },
  });
  revalidatePath("/admin");
}

export async function confirmPaymentAction(formData: FormData) {
  await requireAdmin();
  await db.booking.update({ where: { id: String(formData.get("id")) }, data: { status: "CONFIRMED" } });
  revalidatePath("/admin");
}

export async function rejectPaymentAction(formData: FormData) {
  await requireAdmin();
  await db.booking.update({
    where: { id: String(formData.get("id")) },
    data: { status: "CANCELLED", cancelledBy: "admin" },
  });
  revalidatePath("/admin");
}

/** Marks a past booking as attended ("1") or no-show ("0"). */
export async function markAttendanceAction(formData: FormData) {
  await requireAdmin();
  await db.booking.update({
    where: { id: String(formData.get("id")) },
    data: { attended: formData.get("attended") === "1" },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
}
