import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";

export type Period = "month" | "week" | "day";

export function periodRange(period: Period, reference = new Date()) {
  if (period === "day") {
    return {
      start: format(startOfDay(reference), "yyyy-MM-dd"),
      end: format(endOfDay(reference), "yyyy-MM-dd"),
    };
  }
  if (period === "week") {
    return {
      start: format(startOfWeek(reference, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      end: format(endOfWeek(reference, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    };
  }
  return {
    start: format(startOfMonth(reference), "yyyy-MM-dd"),
    end: format(endOfMonth(reference), "yyyy-MM-dd"),
  };
}

export function todayIso() {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDateFr(date: string) {
  return format(new Date(date + "T00:00:00"), "d MMM yyyy", { locale: fr });
}
