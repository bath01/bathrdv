import "server-only";
import { db } from "@/lib/db";

/** Booking rules. The row is created with defaults on first read. */
export async function getSettings() {
  return db.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}
