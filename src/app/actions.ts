"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { MOBILE_MONEY } from "@/lib/ci";
import { clientIp, hit, minutes } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { getAvailableSlots, holdsSlot, isBookableDate } from "@/lib/slots";
import { isValidDate } from "@/lib/time";

// Public server actions: used by the booking pages, no login required.

export async function getSlotsAction(eventTypeId: string, date: string) {
  if (typeof eventTypeId !== "string" || typeof date !== "string" || !isValidDate(date)) return [];
  if (!hit(`slots:${await clientIp()}`, 120, 60_000).ok) return [];
  const slots = await getAvailableSlots(eventTypeId, date);
  return slots.map((s) => s.toISOString());
}

/** Keeps "+" and digits. Adds +225 to local Ivorian numbers (10 digits). */
function normalizePhone(raw: string) {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (/^\d{10}$/.test(cleaned)) return `+225${cleaned}`;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  return cleaned;
}

const bookingSchema = z.object({
  eventTypeId: z.string().min(1),
  date: z.string().refine(isValidDate),
  start: z.iso.datetime(),
  name: z.string().trim().min(2, "Indiquez votre nom complet.").max(100),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((p) => /^\+?\d{8,15}$/.test(p), "Numéro de téléphone invalide. Exemple : 07 07 07 07 07"),
  email: z.union([z.literal(""), z.email("Adresse email invalide.").max(200)]).optional(),
  notes: z.string().trim().max(1000).optional(),
  commune: z.string().trim().max(60).optional(),
  quartier: z.string().trim().max(200).optional(),
});

export type BookingState = { error?: string; slotTaken?: boolean };

export async function bookAction(_prev: BookingState, formData: FormData): Promise<BookingState> {
  // Anti-spam: 5 bookings per IP per hour.
  const limit = hit(`book:${await clientIp()}`, 5, 60 * 60_000);
  if (!limit.ok) {
    return { error: `Trop de réservations depuis cette connexion. Réessayez dans ${minutes(limit.retryAfter)} min.` };
  }
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Vérifiez le formulaire." };
  }
  const data = parsed.data;

  if (!(await isBookableDate(data.date))) {
    return { error: "Cette date n'est plus disponible.", slotTaken: true };
  }

  // Only accept a start time that the slot calculator offers right now.
  const slots = await getAvailableSlots(data.eventTypeId, data.date);
  const startTime = slots.find((s) => s.getTime() === new Date(data.start).getTime());
  if (!startTime) {
    return { error: "Ce créneau vient d'être pris. Choisissez une autre heure.", slotTaken: true };
  }

  const eventType = await db.eventType.findUniqueOrThrow({ where: { id: data.eventTypeId } });
  if (eventType.atHome && (!data.commune || !data.quartier)) {
    return { error: "Indiquez votre commune et votre quartier pour la visite à domicile." };
  }
  const { pendingMinutes } = await getSettings();
  const endTime = new Date(startTime.getTime() + eventType.duration * 60_000);

  let bookingToken: string;
  try {
    // Serializable transaction: two visitors cannot book the same slot.
    bookingToken = await db.$transaction(
      async (tx) => {
        const clash = await tx.booking.count({
          where: { ...holdsSlot(pendingMinutes), startTime: { lt: endTime }, endTime: { gt: startTime } },
        });
        if (clash > 0) throw new Error("SLOT_TAKEN");
        const booking = await tx.booking.create({
          data: {
            eventTypeId: eventType.id,
            name: data.name,
            phone: data.phone,
            email: data.email || null,
            notes: data.notes || null,
            address: eventType.atHome ? `${data.quartier}, ${data.commune}` : null,
            // With a deposit, the booking waits for the Mobile Money payment.
            status: eventType.deposit ? "PENDING" : "CONFIRMED",
            startTime,
            endTime,
          },
        });
        return booking.token;
      },
      { isolationLevel: "Serializable" },
    );
  } catch {
    return { error: "Ce créneau vient d'être pris. Choisissez une autre heure.", slotTaken: true };
  }

  redirect(`/reservation/${bookingToken}?nouveau=1`);
}

/** Visitor cancels from the booking page. The random token in the link acts as the secret. */
export async function cancelByVisitorAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const booking = await db.booking.findUnique({ where: { token } });
  if (!booking || booking.status === "CANCELLED" || booking.startTime < new Date()) return;
  await db.booking.update({ where: { token }, data: { status: "CANCELLED", cancelledBy: "visitor" } });
  revalidatePath(`/reservation/${token}`);
}

const paymentSchema = z.object({
  token: z.string().min(1).max(64),
  method: z.enum(MOBILE_MONEY.map((m) => m.id) as [string, ...string[]], "Choisissez le moyen de paiement."),
  ref: z.string().trim().min(4, "Saisissez la référence de la transaction.").max(60),
});

export type PaymentState = { error?: string; ok?: boolean };

/** Visitor sends the Mobile Money transaction reference. The admin then checks it. */
export async function submitPaymentAction(_prev: PaymentState, formData: FormData): Promise<PaymentState> {
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { token, method, ref } = parsed.data;
  if (!hit(`pay:${await clientIp()}`, 10, 60 * 60_000).ok) {
    return { error: "Trop de tentatives. Réessayez plus tard ou contactez-nous sur WhatsApp." };
  }

  const booking = await db.booking.findUnique({ where: { token } });
  if (!booking || booking.status !== "PENDING") return { error: "Ce rendez-vous n'attend plus de paiement." };

  // Past the payment delay, the slot was released and may be taken: start again.
  const { pendingMinutes } = await getSettings();
  if (!booking.paymentRef && booking.createdAt.getTime() < Date.now() - pendingMinutes * 60_000) {
    await db.booking.update({ where: { token }, data: { status: "CANCELLED", cancelledBy: "visitor" } });
    revalidatePath(`/reservation/${token}`);
    return { error: `Délai de paiement de ${pendingMinutes} min dépassé. Le créneau a été libéré : réservez à nouveau.` };
  }

  await db.booking.update({ where: { token }, data: { paymentMethod: method, paymentRef: ref } });
  revalidatePath(`/reservation/${token}`);
  return { ok: true };
}
