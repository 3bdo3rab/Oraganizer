"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Footprints, ListTodo, Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { fmtDateFull, fmtTimeIn, todayStr, WEEK_DAYS_AR } from "@/lib/utils-app";
import type { Task } from "@/lib/types";
import { EmptyState } from "./shared";
import { useClockFormat } from "./clock";
import { TaskFormDialog } from "./task-form";

type EventKind = "visit" | "followup" | "task";

interface DayEvent {
  kind: EventKind;
  label: string;
  sub?: string;
  taskId?: string;
}

const KIND_STYLES: Record<EventKind, { chip: string; dot: string; label: string }> = {
  visit: {
    chip: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
    dot: "bg-teal-500",
    label: "زيارة",
  },
  followup: {
    chip: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
    dot: "bg-amber-500",
    label: "متابعة",
  },
  task: {
    chip: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    dot: "bg-purple-500",
    label: "مهمة",
  },
};

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function CalendarView() {
  const tasks = useStore((s) => s.tasks);
  const visits = useStore((s) => s.visits);
  const clients = useStore((s) => s.clients);
  const toggleTask = useStore((s) => s.toggleTask);
  const clockFormat = useClockFormat();

  const today = todayStr();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; date: string } | null>(null);

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "عميل محذوف";

  /** فهرس الأحداث حسب اليوم */
  const eventsByDay = useMemo(() => {
    const nameOf = (id: string) => clients.find((c) => c.id === id)?.name ?? "عميل محذوف";
    const map = new Map<string, DayEvent[]>();
    const push = (date: string, ev: DayEvent) => {
      const arr = map.get(date) ?? [];
      arr.push(ev);
      map.set(date, arr);
    };
    for (const t of tasks) {
      push(t.date, { kind: "task", label: t.title, sub: t.time ? fmtTimeIn(t.time, clockFormat) : undefined, taskId: t.id });
    }
    for (const v of visits) {
      push(v.date, { kind: "visit", label: nameOf(v.clientId), sub: v.result });
      if (v.followUpDate) push(v.followUpDate, { kind: "followup", label: `متابعة زيارة: ${nameOf(v.clientId)}` });
    }
    for (const c of clients) {
      if (c.followUpDate) push(c.followUpDate, { kind: "followup", label: `متابعة عميل: ${c.name}` });
    }
    return map;
  }, [tasks, visits, clients, clockFormat]);

  /** خلايا الشبكة */
  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 1) % 7; // الأسبوع يبدأ بالسبت
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: (string | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      result.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [cursor]);

  const monthLabel = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const moveMonth = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  const goToday = () => {
    const d = new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const selectedEvents = selected ? eventsByDay.get(selected) ?? [] : [];
  const selectedTasks: Task[] = selected
    ? tasks.filter((t) => t.date === selected)
    : [];

  return (
    <div className="space-y-4">
      {/* أدوات الشهر */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-extrabold">{monthLabel}</h2>
        <div className="ms-auto flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" onClick={() => moveMonth(-1)} aria-label="الشهر السابق">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            اليوم
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => moveMonth(1)} aria-label="الشهر التالي">
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>

      {/* مفتاح الألوان */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {(Object.keys(KIND_STYLES) as EventKind[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full", KIND_STYLES[k].dot)} />
            {KIND_STYLES[k].label}
          </span>
        ))}
      </div>

      <Card>
        <CardContent className="p-2 sm:p-4">
          {/* أيام الأسبوع */}
          <div className="grid grid-cols-7 gap-1 border-b pb-2 text-center text-[11px] font-bold text-muted-foreground sm:text-xs">
            {WEEK_DAYS_AR.map((d) => (
              <div key={d}>{d.replace("ال", "")}</div>
            ))}
          </div>
          {/* الشبكة */}
          <div className="grid grid-cols-7 gap-1 pt-2">
            {cells.map((date, i) => {
              if (!date) return <div key={`e${i}`} className="min-h-14 rounded-lg bg-muted/30 sm:min-h-24" />;
              const evs = eventsByDay.get(date) ?? [];
              const isToday = date === today;
              return (
                <button
                  key={date}
                  onClick={() => setSelected(date)}
                  className={cn(
                    "min-h-14 rounded-lg border p-1 text-start align-top transition-colors hover:border-primary/50 sm:min-h-24",
                    isToday ? "border-primary bg-primary/5" : "border-transparent bg-muted/30"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-xs font-bold",
                      isToday ? "bg-primary text-primary-foreground" : "text-foreground/80"
                    )}
                  >
                    {Number(date.slice(-2))}
                  </span>
                  {/* شرائح — شاشات أكبر */}
                  <div className="mt-1 hidden space-y-0.5 sm:block">
                    {evs.slice(0, 3).map((ev, j) => (
                      <div
                        key={j}
                        className={cn("truncate rounded px-1 py-0.5 text-[10px] font-medium leading-4", KIND_STYLES[ev.kind].chip)}
                      >
                        {ev.label}
                      </div>
                    ))}
                    {evs.length > 3 ? (
                      <div className="text-[10px] text-muted-foreground">+{evs.length - 3} أخرى</div>
                    ) : null}
                  </div>
                  {/* نقاط — الجوال */}
                  <div className="mt-1 flex gap-0.5 sm:hidden">
                    {evs.slice(0, 4).map((ev, j) => (
                      <span key={j} className={cn("size-1.5 rounded-full", KIND_STYLES[ev.kind].dot)} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* تفاصيل اليوم */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md" dir="rtl">
          <DialogHeader className="text-start">
            <DialogTitle>{selected ? fmtDateFull(selected) : ""}</DialogTitle>
            <DialogDescription>
              {selectedEvents.length === 0 ? "لا أحداث في هذا اليوم" : `${selectedEvents.length} حدث`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTasks.length > 0 ? (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-sm font-bold">
                  <ListTodo className="size-4 text-primary" /> المهام
                </p>
                <ul className="space-y-1.5">
                  {selectedTasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 rounded-lg border p-2">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => toggleTask(t.id)}
                        className="size-4 accent-[var(--primary)]"
                      />
                      <span className={cn("flex-1 text-sm", t.completed && "text-muted-foreground line-through")}>
                        {t.title}
                      </span>
                      {t.time ? <Badge variant="secondary" className="tabular-nums">{fmtTimeIn(t.time, clockFormat)}</Badge> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {selectedEvents
              .filter((e) => e.kind === "visit")
              .map((e, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50/60 p-2 dark:border-teal-800 dark:bg-teal-950/40">
                  <Footprints className="size-4 shrink-0 text-teal-600 dark:text-teal-300" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{e.label}</p>
                    {e.sub ? <p className="truncate text-xs text-muted-foreground">{e.sub}</p> : null}
                  </div>
                </div>
              ))}

            {selectedEvents
              .filter((e) => e.kind === "followup")
              .map((e, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-2 dark:border-amber-800 dark:bg-amber-950/40">
                  <Users className="size-4 shrink-0 text-amber-600 dark:text-amber-300" />
                  <p className="text-sm">{e.label}</p>
                </div>
              ))}

            {selectedEvents.length === 0 ? (
              <EmptyState icon={CalendarDays} title="يوم فارغ" hint="لا مهام أو زيارات أو متابعات في هذا اليوم" />
            ) : null}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setTaskDialog({ open: true, date: selected ?? today });
              }}
            >
              <Plus className="size-4" /> إضافة مهمة في هذا اليوم
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TaskFormDialog
        open={!!taskDialog?.open}
        onOpenChange={(v) => setTaskDialog(v ? taskDialog : null)}
        defaults={{ date: taskDialog?.date }}
      />
    </div>
  );
}
