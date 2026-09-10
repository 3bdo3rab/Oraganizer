"use client";

import {
  ArrowLeft,
  CalendarClock,
  FolderKanban,
  Footprints,
  ListTodo,
  Plus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { makeTask, projectTotal, useStore } from "@/lib/store";
import {
  CLOSED_STATUSES,
  PRIORITY_ORDER,
  addDaysStr,
  fmtDate,
  greeting,
  relDay,
  todayStr,
} from "@/lib/utils-app";
import { cn } from "@/lib/utils";
import { PriorityBadge, StatusBadge } from "./shared";
import type { NavFn } from "./nav-types";

export function Dashboard({ navigate }: { navigate: NavFn }) {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const visits = useStore((s) => s.visits);
  const settings = useStore((s) => s.settings);
  const addTask = useStore((s) => s.addTask);
  const toggleTask = useStore((s) => s.toggleTask);
  const projectCategories = useStore((s) => s.projectCategories);

  const [quick, setQuick] = useState("");
  const today = todayStr();

  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date === today)
        .sort(
          (a, b) =>
            Number(a.completed) - Number(b.completed) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        ),
    [tasks, today]
  );

  const upcomingVisits = useMemo(
    () => visits.filter((v) => v.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
    [visits, today]
  );

  const weekVisits = useMemo(() => {
    const endStr = addDaysStr(today, 7);
    return visits.filter((v) => v.date >= today && v.date <= endStr).length;
  }, [visits, today]);

  /** عملاء يحتاجون متابعة: متابعة العميل أو متابعة زيارة مستحقة ولم يُغلق */
  const needFollowUp = useMemo(() => {
    const due = new Map<string, string>();
    for (const c of clients) {
      if (c.followUpDate && c.followUpDate <= today && !CLOSED_STATUSES.includes(c.status)) {
        due.set(c.id, c.followUpDate);
      }
    }
    for (const v of visits) {
      if (v.followUpDate && v.followUpDate <= today) {
        const c = clients.find((x) => x.id === v.clientId);
        if (!c || CLOSED_STATUSES.includes(c.status)) continue;
        const cur = due.get(c.id);
        if (!cur || v.followUpDate < cur) due.set(c.id, v.followUpDate);
      }
    }
    return [...due.entries()]
      .map(([id, date]) => ({ client: clients.find((c) => c.id === id)!, date }))
      .filter((x) => x.client)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [clients, visits, today]);

  const activeProjects = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4),
    [projects]
  );

  const activeClientsCount = clients.filter((c) => !CLOSED_STATUSES.includes(c.status)).length;
  const doneToday = todayTasks.filter((t) => t.completed).length;

  const quickAdd = () => {
    const title = quick.trim();
    if (!title) return;
    addTask(makeTask({ title, date: today }));
    setQuick("");
  };

  const clientName = (id?: string) => clients.find((c) => c.id === id)?.name;

  const stats = [
    { label: "مشاريعي", value: projects.length, icon: FolderKanban, view: "projects" as const },
    { label: "العملاء المحتملون", value: activeClientsCount, icon: Users, view: "clients" as const },
    { label: "مهام اليوم", value: `${doneToday}/${todayTasks.length}`, icon: ListTodo, view: "tasks" as const },
    { label: "زيارات هذا الأسبوع", value: weekVisits, icon: Footprints, view: "visits" as const },
  ];

  return (
    <div className="space-y-5">
      {/* ترحيب */}
      <section>
        <h2 className="text-xl font-extrabold sm:text-2xl">
          {greeting()} <span className="text-primary">👋</span>
        </h2>
        <p className="text-sm text-muted-foreground">هذه حالة عملك اليوم بنظرة سريعة</p>
      </section>

      {/* ملخص سريع */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.label} onClick={() => navigate(s.view)} className="text-start">
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-extrabold leading-tight">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* مهام اليوم */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <ListTodo className="size-4.5 text-primary" />
            <h3 className="font-bold">مهام اليوم</h3>
            <Button variant="ghost" size="sm" className="ms-auto text-primary" onClick={() => navigate("tasks")}>
              كل المهام <ArrowLeft className="size-4" />
            </Button>
          </div>
          <Card>
            <CardContent className="space-y-2 p-3">
              <div className="flex gap-2">
                <Input
                  value={quick}
                  onChange={(e) => setQuick(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && quickAdd()}
                  placeholder="مهمة سريعة لليوم… اضغط Enter"
                />
                <Button size="icon" onClick={quickAdd} aria-label="إضافة مهمة" className="shrink-0">
                  <Plus className="size-4" />
                </Button>
              </div>
              {todayTasks.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">لا مهام لليوم — استمتع بيومك ☕</p>
              ) : (
                <ul className="divide-y">
                  {todayTasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 py-2">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => toggleTask(t.id)}
                        className="size-4 shrink-0 accent-[var(--primary)]"
                        aria-label={`إتمام: ${t.title}`}
                      />
                      <span className={cn("min-w-0 flex-1 truncate text-sm", t.completed && "text-muted-foreground line-through")}>
                        {t.title}
                      </span>
                      {!t.completed && <PriorityBadge priority={t.priority} />}
                      {t.time ? (
                        <Badge variant="secondary" className="shrink-0">
                          {t.time}
                        </Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* الزيارات القادمة */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Footprints className="size-4.5 text-primary" />
            <h3 className="font-bold">الزيارات القادمة</h3>
            <Button variant="ghost" size="sm" className="ms-auto text-primary" onClick={() => navigate("visits")}>
              السجل الكامل <ArrowLeft className="size-4" />
            </Button>
          </div>
          <Card>
            <CardContent className="p-3">
              {upcomingVisits.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">لا زيارات مجدولة قادمًا</p>
              ) : (
                <ul className="divide-y">
                  {upcomingVisits.map((v) => (
                    <li key={v.id}>
                      <button
                        className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-start hover:bg-accent"
                        onClick={() => navigate("clients", { clientId: v.clientId })}
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <CalendarClock className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{clientName(v.clientId) ?? "عميل محذوف"}</p>
                          {v.result ? <p className="truncate text-xs text-muted-foreground">{v.result}</p> : null}
                        </div>
                        <div className="shrink-0 text-end">
                          <p className="text-xs font-medium">{relDay(v.date)}</p>
                          <p className="text-[11px] text-muted-foreground">{fmtDate(v.date)}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* عملاء يحتاجون متابعة */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Users className="size-4.5 text-primary" />
            <h3 className="font-bold">عملاء يحتاجون متابعة</h3>
          </div>
          <Card>
            <CardContent className="p-3">
              {needFollowUp.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">لا يوجد أحد بحاجة لمتابعة حاليًا</p>
              ) : (
                <ul className="divide-y">
                  {needFollowUp.map(({ client, date }) => (
                    <li key={client.id}>
                      <button
                        className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-start hover:bg-accent"
                        onClick={() => navigate("clients", { clientId: client.id })}
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          <Users className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{client.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{client.location || client.category}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <StatusBadge status={client.status} />
                          <span className="text-[11px] text-muted-foreground">
                            {relDay(date)} — {fmtDate(date)}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* المشاريع الحالية */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <FolderKanban className="size-4.5 text-primary" />
            <h3 className="font-bold">المشاريع الحالية</h3>
            <Button variant="ghost" size="sm" className="ms-auto text-primary" onClick={() => navigate("projects")}>
              كل المشاريع <ArrowLeft className="size-4" />
            </Button>
          </div>
          {activeProjects.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">لا مشاريع بعد</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeProjects.map((p) => (
                <button key={p.id} className="block w-full text-start" onClick={() => navigate("projects", { projectId: p.id })}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center gap-3 p-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {settings.stageNames[p.stage] ? `${settings.stageNames[p.stage]} • ` : ""}
                          {projectTotal(p) > 0 ? `$${projectTotal(p).toLocaleString("en-US")}` : "بدون سعر"}
                        </p>
                      </div>
                      {p.categoryId ? (
                        <Badge variant="outline" className="shrink-0">
                          {projectCategories.find((c) => c.id === p.categoryId)?.name ?? ""}
                        </Badge>
                      ) : null}
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
