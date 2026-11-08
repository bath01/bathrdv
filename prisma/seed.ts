// Demo data: one meeting type and Monday-Friday 09:00-17:00 opening hours.
// Run with: npm run db:seed
import "dotenv/config";
import { db } from "../src/lib/db";

async function main() {
  await db.eventType.upsert({
    where: { slug: "appel-30-min" },
    update: {},
    create: {
      title: "Appel 30 min",
      slug: "appel-30-min",
      description: "Un premier échange pour discuter de votre projet.",
      duration: 30,
      location: "Google Meet",
    },
  });

  if ((await db.availability.count()) === 0) {
    await db.availability.createMany({
      data: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, startTime: "09:00", endTime: "17:00" })),
    });
  }

  await db.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  console.log("Seed OK");
}

main().finally(() => db.$disconnect());
