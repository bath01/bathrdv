// Resets the database to a realistic demo for an Abidjan business.
// WARNING: deletes all bookings, event types, hours and closed days.
// Run with: npm run db:demo
import "dotenv/config";
import { ivorianHolidays } from "../src/lib/ci";
import { db } from "../src/lib/db";
import { addDaysToDate, todayInZone, weekdayOf, zonedToUtc } from "../src/lib/time";

const today = todayInZone();

/** N-th open day (Mon-Sat) from today; negative = in the past. */
function openDay(n: number) {
  const step = n < 0 ? -1 : 1;
  let date = today;
  let count = 0;
  while (count < Math.abs(n)) {
    date = addDaysToDate(date, step);
    if (weekdayOf(date) !== 0) count++;
  }
  return date;
}

async function main() {
  await db.booking.deleteMany();
  await db.eventType.deleteMany();
  await db.availability.deleteMany();
  await db.blockedDate.deleteMany();

  await db.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  await db.settings.update({
    where: { id: 1 },
    data: {
      businessName: "BATHRDV",
      phone: "+2250700000001",
      address: "Cocody Riviera 3, Abidjan",
      waveNumber: "07 00 00 00 01",
      orangeMoneyNumber: "07 00 00 00 01",
      mtnMoneyNumber: "05 00 00 00 01",
      moovMoneyNumber: null,
      pendingMinutes: 60,
      minNoticeHours: 2,
      bufferMinutes: 15,
      bookingWindowDays: 30,
    },
  });

  // Monday-Friday 08:00-12:00 and 14:00-18:00, Saturday morning.
  await db.availability.createMany({
    data: [
      ...[1, 2, 3, 4, 5].flatMap((weekday) => [
        { weekday, startTime: "08:00", endTime: "12:00" },
        { weekday, startTime: "14:00", endTime: "18:00" },
      ]),
      { weekday: 6, startTime: "09:00", endTime: "13:00" },
    ],
  });

  const year = Number(today.slice(0, 4));
  await db.blockedDate.createMany({
    data: [...ivorianHolidays(year), ...ivorianHolidays(year + 1)].filter((h) => h.date >= today),
    skipDuplicates: true,
  });

  const [decouverte, consultation, domicile, suivi] = await Promise.all([
    db.eventType.create({
      data: {
        title: "Appel découverte",
        slug: "appel-decouverte",
        description: "15 minutes pour faire connaissance et comprendre votre besoin. Sans engagement.",
        duration: 15,
        location: "Appel WhatsApp",
      },
    }),
    db.eventType.create({
      data: {
        title: "Consultation au cabinet",
        slug: "consultation",
        description: "Rendez-vous complet au cabinet. Venez 10 minutes en avance.",
        duration: 60,
        price: 15000,
        deposit: 5000,
      },
    }),
    db.eventType.create({
      data: {
        title: "Intervention à domicile",
        slug: "domicile",
        description: "Nous venons chez vous, partout à Abidjan. Prévoir 30 min de marge selon la circulation.",
        duration: 90,
        price: 25000,
        deposit: 10000,
        atHome: true,
      },
    }),
    db.eventType.create({
      data: {
        title: "Suivi en ligne",
        slug: "suivi-en-ligne",
        description: "Point de suivi en visio pour les clients déjà accompagnés.",
        duration: 30,
        price: 10000,
        location: "Google Meet",
      },
    }),
  ]);

  type Demo = {
    type: { id: string; duration: number };
    day: number;
    time: string;
    name: string;
    phone: string;
    status?: "PENDING" | "CONFIRMED" | "CANCELLED";
    attended?: boolean;
    address?: string;
    notes?: string;
    paymentMethod?: string;
    paymentRef?: string;
    cancelledBy?: string;
  };

  const demo: Demo[] = [
    // Past
    { type: consultation, day: -6, time: "09:00", name: "Kouadio Yao", phone: "+2250701020304", attended: true },
    { type: domicile, day: -5, time: "14:00", name: "Aya N'Guessan", phone: "+2250504030201", attended: true, address: "Angré 8e tranche, près de la pharmacie Les Oliviers, Cocody" },
    { type: consultation, day: -4, time: "10:00", name: "Moussa Traoré", phone: "+2250102030405", attended: false },
    { type: suivi, day: -3, time: "15:00", name: "Kouadio Yao", phone: "+2250701020304", attended: true },
    { type: consultation, day: -2, time: "08:00", name: "Moussa Traoré", phone: "+2250102030405", attended: false, notes: "N'a pas répondu au rappel" },
    { type: decouverte, day: -1, time: "11:00", name: "Fatou Diabaté", phone: "+2250708091011" },
    // Upcoming
    { type: consultation, day: 1, time: "09:00", name: "Awa Koné", phone: "+2250707070707", notes: "Première consultation" },
    { type: decouverte, day: 1, time: "11:00", name: "Jean-Marc Kouassi", phone: "+2250556677889" },
    { type: domicile, day: 1, time: "14:00", name: "Mariam Coulibaly", phone: "+2250777889900", address: "Yopougon Maroc, derrière le marché, Yopougon" },
    { type: suivi, day: 2, time: "10:00", name: "Kouadio Yao", phone: "+2250701020304" },
    { type: consultation, day: 3, time: "15:00", name: "Serge Bamba", phone: "+2250145678901" },
    { type: consultation, day: 4, time: "09:00", name: "Adjoua Konan", phone: "+2250798765432", status: "PENDING", paymentMethod: "wave", paymentRef: "T_8KD2-91XZ", notes: "Acompte envoyé par Wave" },
    { type: domicile, day: 5, time: "08:00", name: "Ibrahim Ouattara", phone: "+2250566554433", status: "PENDING", address: "Zone 4, rue du Docteur Blanchard, Marcory" },
    { type: consultation, day: 2, time: "16:00", name: "Moussa Traoré", phone: "+2250102030405", status: "CANCELLED", cancelledBy: "admin" },
    { type: decouverte, day: 3, time: "08:00", name: "Rokia Sanogo", phone: "+2250712121212", status: "CANCELLED", cancelledBy: "visitor" },
  ];

  for (const d of demo) {
    const startTime = zonedToUtc(openDay(d.day), d.time);
    await db.booking.create({
      data: {
        eventTypeId: d.type.id,
        name: d.name,
        phone: d.phone,
        notes: d.notes,
        address: d.address,
        status: d.status ?? "CONFIRMED",
        attended: d.attended,
        paymentMethod: d.paymentMethod,
        paymentRef: d.paymentRef,
        cancelledBy: d.cancelledBy,
        startTime,
        endTime: new Date(startTime.getTime() + d.type.duration * 60_000),
      },
    });
  }

  console.log(`Démo prête : 4 types de RDV, ${demo.length} réservations.`);
}

main().finally(() => db.$disconnect());
