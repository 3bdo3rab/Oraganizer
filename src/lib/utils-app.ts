import type { ClientStatus, ClockFormat, StageIndex, TaskPriority } from "./types";

/* ---------- معرّفات ---------- */
export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ---------- تواريخ (بدون مكتبات، توقيت محلي) ---------- */
const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
/** أيام الشبكة الأسبوعية بدايةً بالسبت */
export const WEEK_DAYS_AR = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function addDaysStr(s: string, days: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function diffDays(fromStr: string, toStr: string): number {
  const a = parseDate(fromStr).getTime();
  const b = parseDate(toStr).getTime();
  return Math.round((b - a) / 86400000);
}

/** "10 سبتمبر 2025" */
export function fmtDate(s?: string): string {
  if (!s) return "—";
  const d = parseDate(s);
  return `${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
}

/** "الخميس 10 سبتمبر 2025" */
export function fmtDateFull(s?: string): string {
  if (!s) return "—";
  const d = parseDate(s);
  return `${DAYS_AR[d.getDay()]} ${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
}

/** "الخميس، 10 سبتمبر 2025" مع الوقت الحقيقي لتاريخ اليوم */
export function fmtTodayFull(): string {
  const d = new Date();
  return `${DAYS_AR[d.getDay()]} ${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
}

export function dayName(s: string): string {
  return DAYS_AR[parseDate(s).getDay()];
}

/** وصف نسبي لليوم: اليوم / غدًا / أمس / بعد 3 أيام / قبل يومين */
export function relDay(s?: string): string {
  if (!s) return "";
  const n = diffDays(todayStr(), s);
  if (n === 0) return "اليوم";
  if (n === 1) return "غدًا";
  if (n === 2) return "بعد غد";
  if (n === -1) return "أمس";
  if (n > 0) return `بعد ${n} أيام`;
  if (n === -2) return "قبل يومين";
  return `قبل ${Math.abs(n)} أيام`;
}

/** صيغة الوقت 14:30 → 2:30 م */
export function fmtTime(t?: string): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = Number(hStr);
  const m = mStr || "00";
  const period = h >= 12 ? "م" : "ص";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${period}`;
}

/* ---------- الساعة الرقمية ---------- */

/** أجزاء الوقت الحالي حسب نمط الساعة (12 أو 24) */
export function clockParts(d: Date, format: ClockFormat): { main: string; seconds: string; period: string } {
  const h24 = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  if (format === "24") {
    return { main: `${String(h24).padStart(2, "0")}:${m}`, seconds: s, period: "" };
  }
  const period = h24 >= 12 ? "م" : "ص";
  let h = h24 % 12;
  if (h === 0) h = 12;
  return { main: `${String(h).padStart(2, "0")}:${m}`, seconds: s, period };
}

/** وقت مخزّن بصيغة HH:mm معروض حسب نمط الساعة المختار */
export function fmtTimeIn(t: string | undefined, format: ClockFormat): string {
  if (!t) return "";
  if (format === "24") return t;
  return fmtTime(t);
}

/* ---------- أموال ---------- */
export function fmtMoney(n?: number): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  if (n <= 0) return "—";
  return `$${n.toLocaleString("en-US")}`;
}

export function fmtMoneyOrZero(n?: number): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "$0";
  return `$${n.toLocaleString("en-US")}`;
}

/* ---------- أنماط الحالات والأولويات ---------- */
export const STATUS_STYLES: Record<ClientStatus, string> = {
  "جديد": "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
  "تم التواصل": "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  "مهتم": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  "بانتظار الرد": "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
  "مرفوض": "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
  "صار عميلاً": "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-600 dark:text-white",
};

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  "عالية": "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
  "متوسطة": "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  "عادية": "bg-muted text-muted-foreground border-border",
};

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  "عالية": 0,
  "متوسطة": 1,
  "عادية": 2,
};

export const CLOSED_STATUSES: ClientStatus[] = ["مرفوض", "صار عميلاً"];

export function stageName(idx: StageIndex, names: [string, string, string]): string {
  return names[idx] ?? `المرحلة ${idx + 1}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "صباح الخير";
  if (h < 17) return "طاب يومك";
  return "مساء الخير";
}
