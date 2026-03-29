import { addDays, endOfDay, startOfDay } from "date-fns";

export type ScheduleKind = "reminder" | "questionnaire" | "appointment";

export type ScheduleVisibilityInput = {
  kind: ScheduleKind;
  scheduledAt: Date;
  completedAt?: Date | null;
  isActive?: boolean | null;
};

/**
 * - Reminders & questionnaires (active): calendar day is **today** or **tomorrow** only.
 * - Appointments: same today/tomorrow window, **plus** incomplete appointments from earlier
 *   days (still visible until completed), capped to the last 30 days to avoid unbounded lists.
 * - Items with `scheduledAt` later than end of tomorrow are excluded (not in this “upcoming” view).
 */
export function shouldShowInUpcoming(
  item: ScheduleVisibilityInput,
  now: Date = new Date(),
): boolean {
  if (item.completedAt) return false;
  if (item.kind === "questionnaire" && item.isActive === false) return false;

  const todayStart = startOfDay(now);
  const tomorrowEnd = endOfDay(addDays(now, 1));
  const sched = new Date(item.scheduledAt);
  const schedDayStart = startOfDay(sched);

  if (sched > tomorrowEnd) return false;

  if (item.kind === "appointment") {
    const inTodayOrTomorrowWindow =
      schedDayStart >= todayStart && schedDayStart <= tomorrowEnd;
    if (inTodayOrTomorrowWindow) return true;

    const cutoff = addDays(todayStart, -30);
    const overdueIncomplete = sched < todayStart && sched >= cutoff;
    return overdueIncomplete;
  }

  return schedDayStart >= todayStart && schedDayStart <= tomorrowEnd;
}
