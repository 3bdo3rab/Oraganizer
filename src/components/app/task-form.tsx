"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { makeTask, useStore } from "@/lib/store";
import { TASK_PRIORITIES, type Task, type TaskPriority } from "@/lib/types";
import { DateInput, Field } from "./shared";

function TaskFormInner({
  task,
  defaults,
  close,
}: {
  task?: Task;
  defaults?: Partial<Task>;
  close: () => void;
}) {
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);

  const [form, setForm] = useState<Task>(() => makeTask({ ...defaults, ...task }));
  const [err, setErr] = useState("");

  const save = () => {
    if (!form.title.trim()) return setErr("اكتب عنوان المهمة");
    if (!form.date) return setErr("اختر تاريخ المهمة");
    const clean: Task = { ...form, title: form.title.trim(), time: form.time || undefined };
    if (task) {
      updateTask(task.id, clean);
      toast.success("تم تعديل المهمة");
    } else {
      addTask(clean);
      toast.success("تمت إضافة المهمة");
    }
    close();
  };

  return (
    <>
      <div className="space-y-4">
        <Field label="اسم المهمة *">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="عنوان قصير وواضح"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="التاريخ *">
            <DateInput value={form.date} onChange={(v) => setForm({ ...form, date: v ?? "" })} />
          </Field>
          <Field label="الوقت (اختياري)">
            <Input
              type="time"
              dir="ltr"
              className="bg-background"
              value={form.time ?? ""}
              onChange={(e) => setForm({ ...form, time: e.target.value || undefined })}
            />
          </Field>
        </div>
        <Field label="الأولوية">
          <Select
            value={form.priority}
            onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="الربط (اختياري)">
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={form.projectId ?? "none"}
              onValueChange={(v) => setForm({ ...form, projectId: v === "none" ? undefined : v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="مشروع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون مشروع</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={form.clientId ?? "none"}
              onValueChange={(v) => setForm({ ...form, clientId: v === "none" ? undefined : v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="عميل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون عميل</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Field>
        {task ? (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">مكتملة</span>
            <Switch checked={form.completed} onCheckedChange={(v) => setForm({ ...form, completed: v })} />
          </div>
        ) : null}
        {err ? <p className="text-sm text-destructive">{err}</p> : null}
      </div>
      <div className="mt-4 flex flex-row-reverse gap-2">
        <Button onClick={save}>{task ? "حفظ التعديل" : "إضافة المهمة"}</Button>
        <Button variant="outline" onClick={close}>
          إلغاء
        </Button>
      </div>
    </>
  );
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaults,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task;
  defaults?: Partial<Task>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md" dir="rtl">
        <DialogHeader className="text-start">
          <DialogTitle>{task ? "تعديل المهمة" : "مهمة جديدة"}</DialogTitle>
        </DialogHeader>
        {open ? (
          <TaskFormInner
            key={task?.id ?? "new"}
            task={task}
            defaults={defaults}
            close={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
