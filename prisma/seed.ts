import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@quant.local" },
    update: {},
    create: {
      email: "admin@quant.local",
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Created admin user:", admin.email);

  // Create default work schedule (Mon-Fri 9:00-17:00)
  const weekdays = [
    { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", isActive: false }, // Sunday
    { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isActive: true },  // Monday
    { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isActive: true },  // Tuesday
    { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isActive: true },  // Wednesday
    { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isActive: true },  // Thursday
    { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isActive: true },  // Friday
    { dayOfWeek: 6, startTime: "09:00", endTime: "17:00", isActive: false }, // Saturday
  ];

  for (const schedule of weekdays) {
    await prisma.workSchedule.upsert({
      where: { dayOfWeek: schedule.dayOfWeek },
      update: {},
      create: {
        ...schedule,
        createdBy: admin.id,
      },
    });
  }

  console.log("Created default work schedules (Mon-Fri 9:00-17:00)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
