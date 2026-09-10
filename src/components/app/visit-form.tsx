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
import { Textarea } from "@/components/ui/textarea";
import { makeVisit, useStore } from "@/lib/store";
import type { Visit } from "@/lib/types";
import { DateInput, Field } from "./shared";

function VisitFormInner({
  visit,
  fixedClientId,
  close,
}: {
  visit?: Visit;
  fixedClientId?: string;
  close: () => void;
}) {
  const clients = useStore((s) => s.clients);
  const addVisit = useStore((s) => s.addVisit);
  const updateVisit = useStore((s) => s.updateVisit);

  const [form, setForm] = useState<Visit>(() =>
    makeVisit({ ...visit, clientId: visit?.clientId ?? fixedClientId })
  );
  const [err, setErr] = useState("");

  const save = () => {
    if (!form.clientId) return setErr("اختر العميل");
    if (!form.date) return setErr("اختر تاريخ الزيارة");
    if (visit) {
      updateVisit(visit.id, form);
      toast.success("تم تعديل الزيارة");
    } else {
      addVisit(form);
      toast.success("تمت إضافة الزيارة");
    }
    close();
  };

  const set = (patch: Partial<Visit>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="العميل *">
            {fixedClientId && !visit ? (
              <Input value={clients.find((c) => c.id === fixedClientId)?.name ?? ""} disabled />
            ) : (
              <Select value={form.clientId} onValueChange={(v) => set({ clientId: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر العميل" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
          <Field label="تاريخ الزيارة *">
            <DateInput value={form.date} onChange={(v) => set({ date: v ?? "" })} />
          </Field>
        </div>
        <Field label="موعد المتابعة (اختياري)">
          <DateInput value={form.followUpDate} onChange={(v) => set({ followUpDate: v })} />
        </Field>
        <Field label="نتيجة الزيارة">
          <Textarea
            rows={2}
            value={form.result}
            onChange={(e) => set({ result: e.target.value })}
            placeholder="ماذا حصل في الزيارة؟"
          />
        </Field>
        <Field label="ماذا طلب العميل؟">
          <Textarea
            rows={2}
            value={form.clientRequest}
            onChange={(e) => set({ clientRequest: e.target.value })}
          />
        </Field>
        <Field label="ملاحظات على المشروع">
          <Textarea
            rows={2}
            value={form.projectNotes}
            onChange={(e) => set({ projectNotes: e.target.value })}
            placeholder="تعديلات أو إضافات على المشروع بعد الزيارة"
          />
        </Field>
        <Field label="ملاحظات لتحسين البيع والتسويق">
          <Textarea
            rows={2}
            value={form.marketingNotes}
            onChange={(e) => set({ marketingNotes: e.target.value })}
            placeholder="كيف أحسّن أسلوبي في الترويج؟"
          />
        </Field>
        <Field label="ملاحظات عامة">
          <Textarea rows={2} value={form.generalNotes} onChange={(e) => set({ generalNotes: e.target.value })} />
        </Field>
        {err ? <p className="text-sm text-destructive">{err}</p> : null}
      </div>
      <div className="mt-4 flex flex-row-reverse gap-2">
        <Button onClick={save}>{visit ? "حفظ التعديل" : "إضافة الزيارة"}</Button>
        <Button variant="outline" onClick={close}>
          إلغاء
        </Button>
      </div>
    </>
  );
}

export function VisitFormDialog({
  open,
  onOpenChange,
  visit,
  fixedClientId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  visit?: Visit;
  fixedClientId?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" dir="rtl">
        <DialogHeader className="text-start">
          <DialogTitle>{visit ? "تعديل الزيارة" : "زيارة جديدة"}</DialogTitle>
        </DialogHeader>
        {open ? (
          <VisitFormInner
            key={visit?.id ?? "new"}
            visit={visit}
            fixedClientId={fixedClientId}
            close={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
