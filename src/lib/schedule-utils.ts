import { prisma } from "./prisma";

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export interface ScheduleInfo {
  isWithinSchedule: boolean;
  currentDay: string;
  todaySchedule: {
    startTime: string;
    endTime: string;
    isActive: boolean;
  } | null;
  nextAvailable: string | null;
}

export async function checkSchedule(): Promise<ScheduleInfo> {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const todaySchedule = await prisma.workSchedule.findUnique({
    where: { dayOfWeek },
  });

  if (!todaySchedule || !todaySchedule.isActive) {
    const nextAvailable = await getNextAvailableWindow(dayOfWeek);
    return {
      isWithinSchedule: false,
      currentDay: DAY_NAMES[dayOfWeek],
      todaySchedule: todaySchedule
        ? {
            startTime: todaySchedule.startTime,
            endTime: todaySchedule.endTime,
            isActive: todaySchedule.isActive,
          }
        : null,
      nextAvailable,
    };
  }

  const isWithin =
    currentTime >= todaySchedule.startTime &&
    currentTime < todaySchedule.endTime;

  return {
    isWithinSchedule: isWithin,
    currentDay: DAY_NAMES[dayOfWeek],
    todaySchedule: {
      startTime: todaySchedule.startTime,
      endTime: todaySchedule.endTime,
      isActive: todaySchedule.isActive,
    },
    nextAvailable: isWithin
      ? null
      : currentTime < todaySchedule.startTime
        ? `Today at ${todaySchedule.startTime}`
        : await getNextAvailableWindow(dayOfWeek),
  };
}

async function getNextAvailableWindow(
  currentDay: number
): Promise<string | null> {
  const schedules = await prisma.workSchedule.findMany({
    where: { isActive: true },
    orderBy: { dayOfWeek: "asc" },
  });

  if (schedules.length === 0) return null;

  // Find next active day after current day
  const nextSchedule =
    schedules.find((s) => s.dayOfWeek > currentDay) || schedules[0];

  return `${DAY_NAMES[nextSchedule.dayOfWeek]} at ${nextSchedule.startTime}`;
}
