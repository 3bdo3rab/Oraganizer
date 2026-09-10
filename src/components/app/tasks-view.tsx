"use client";

import { CalendarDays, CircleCheckBig, ListTodo, Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { makeTask, useStore } from "@/lib/store";
import { PRIORITY_ORDER, fmtDate, fmtTime, relDay, todayStr } from "@/lib/utils-app";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { ConfirmDelete, EmptyState, PriorityBadge } from "./shared";
import { TaskFormDialog } from "./task-form";

type Filter = "all" | "today" | "upcoming" | "overdue" | "done";

function TaskRow({
  task,
  onEdit,
  showDate,
}: {
  task: Task;
  onEdit: () => void;
  showDate?: boolean;
}) {
  const toggleTask = useStore((s) => s.toggleTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const project = projects.find((p) => p.id === task.projectId);
  const client = clients.find((c) => c.id === task.clientId);

  return (
    <li className="group flex items-start gap-3 py-2.5">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => toggleTask(task.id)}
        className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
        aria-label={`إتمام: ${task.title}`}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", task.completed && "text-muted-foreground line-through")}>
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          {showDate && task.date ? (
            <Badge variant="secondary" className="gap-1">
              <CalendarDays className="size-3" />
              {fmtDate(task.date)}
              {task.date === todayStr() ? " — اليوم" : task.date < todayStr() ? "" : ` — ${relDay(task.date)}`}
            </Badge>
          ) : null}
          {task.time ? (
            <Badge variant="secondary">{fmtTime(task.time)}</Badge>
          ) : null}
          {project ? (
            <Badge variant="outline" className="text-primary border-primary/30">
              {project.name}
            </Badge>
          ) : null}
          {client ? (
            <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-800">
              {client.name}
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={onEdit} aria-label="تعديل">
          <Pencil className="size-4" />
        </Button>
        <ConfirmDelete
          itemLabel="المهمة"
          onConfirm={() => {
            deleteTask(task.id);
            toast.success("تم حذف المهمة");
          }}
        />
      </div>
    </li>
  );
}

export function TasksView() {
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);
  const [filter, setFilter] = useState<Filter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [quick, setQuick] = useState("");
  const today = todayStr();

  const groups = useMemo(() => {
    const open = tasks.filter((t) => !t.completed);
    const done = tasks.filter((t) => t.completed);
    const byDate = (a: Task, b: Task) =>
      a.date.localeCompare(b.date) ||
      (a.time ?? "99").localeCompare(b.time ?? "99") ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    return {
      overdue: open.filter((t) => t.date < today).sort(byDate),
      today: open.filter((t) => t.date === today).sort(byDate),
      upcoming: open.filter((t) => t.date > today).sort(byDate),
      done: done.sort((a, b) => b.date.localeCompare(a.date)),
    };
  }, [tasks, today]);

  const quickAdd = () => {
    const title = quick.trim();
    if (!title) return;
    addTask(makeTask({ title, date: today }));
    setQuick("");
    toast.success("تمت إضافة المهمة لليوم");
  };

  const section = (title: string, list: Task[], tone: string, showDate = true) => {
    if (list.length === 0) return null;
    return (
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className={cn("text-sm font-bold", tone)}>{title}</span>
          <Badge variant="secondary">{list.length}</Badge>
        </div>
        <ul className="divide-y">
          {list.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              showDate={showDate}
              onEdit={() => {
                setEditing(t);
                setDialogOpen(true);
              }}
            />
          ))}
        </ul>
      </div>
    );
  };

  const visible =
    filter === "overdue" ? { overdue: groups.overdue } :
    filter === "today" ? { today: groups.today } :
    filter === "upcoming" ? { upcoming: groups.upcoming } :
    filter === "done" ? { done: groups.done } :
    groups;

  const isEmpty = Object.values(visible).every((l) => l.length === 0);

  return (
    <div className="space-y-4">
      {/* إضافة سريعة */}
      <div className="flex gap-2">
        <Input
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && quickAdd()}
          placeholder="أضف مهمة لليوم بسرعة… اضغط Enter"
        />
        <Button onClick={quickAdd} className="shrink-0" aria-label="إضافة سريعة">
          <Plus className="size-4" /> إضافة
        </Button>
        <Button
          variant="outline"
          className="shrink-0"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> مهمة مفصّلة
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="w-full justify-start overflow-x-auto h-auto flex-nowrap">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="overdue">
            المتأخرة
            {groups.overdue.length > 0 ? <Badge className="ms-1 bg-red-100 text-red-700 border-0 px-1.5">{groups.overdue.length}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="today">اليوم</TabsTrigger>
          <TabsTrigger value="upcoming">القادمة</TabsTrigger>
          <TabsTrigger value="done">المكتملة</TabsTrigger>
        </TabsList>
      </Tabs>

      {isEmpty ? (
        <EmptyState
          icon={CircleCheckBig}
          title="لا مهام هنا"
          hint="أضف مهمة جديدة من الحقل بالأعلى، أو عدّل التصفية"
        />
      ) : (
        <Card>
          <CardContent className="space-y-5 p-4">
            {"overdue" in visible && visible.overdue
              ? section("متأخرة", visible.overdue, "text-red-600 dark:text-red-400")
              : null}
            {"today" in visible && visible.today
              ? section("اليوم", visible.today, "text-primary")
              : null}
            {"upcoming" in visible && visible.upcoming
              ? section("القادمة", visible.upcoming, "text-muted-foreground")
              : null}
            {"done" in visible && visible.done
              ? section("مكتملة", visible.done, "text-emerald-600 dark:text-emerald-400", false)
              : null}
          </CardContent>
        </Card>
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditing(undefined);
        }}
        task={editing}
        defaults={editing ? undefined : { date: today }}
      />
    </div>
  );
}
