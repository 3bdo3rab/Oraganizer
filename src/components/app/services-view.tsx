"use client";

import { Briefcase, Pencil, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { makeService, useStore } from "@/lib/store";
import { fmtMoney } from "@/lib/utils-app";
import type { Service } from "@/lib/types";
import { ConfirmDelete, EmptyState, Field } from "./shared";

function ServiceFormInner({
  service,
  close,
}: {
  service?: Service;
  close: () => void;
}) {
  const categories = useStore((s) => s.serviceCategories);
  const addService = useStore((s) => s.addService);
  const updateService = useStore((s) => s.updateService);
  const [form, setForm] = useState<Service>(() => (service ? { ...service } : makeService()));
  const [err, setErr] = useState("");

  const save = () => {
    if (!form.name.trim()) return setErr("اكتب اسم الخدمة");
    const clean = { ...form, name: form.name.trim(), price: form.price || undefined };
    if (service) {
      updateService(service.id, clean);
      toast.success("تم حفظ الخدمة");
    } else {
      addService(clean);
      toast.success("تمت إضافة الخدمة");
    }
    close();
  };

  return (
    <>
      <div className="space-y-4">
        <Field label="اسم الخدمة *">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: تصميم شعار"
              autoFocus
            />
          </Field>
          <Field label="التصنيف">
            <Select
              value={form.categoryId ?? "none"}
              onValueChange={(v) => setForm({ ...form, categoryId: v === "none" ? undefined : v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون تصنيف</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="السعر ($)" hint="اتركه فارغًا إذا كان السعر يُحدد لاحقًا حسب العمل">
            <Input
              type="number"
              dir="ltr"
              min={0}
              value={form.price ?? ""}
              onChange={(e) => setForm({ ...form, price: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="0"
            />
          </Field>
          <Field label="ملاحظات">
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
        </div>
      <div className="mt-4 flex flex-row-reverse gap-2">
        <Button onClick={save}>{service ? "حفظ التعديل" : "إضافة الخدمة"}</Button>
        <Button variant="outline" onClick={close}>
          إلغاء
        </Button>
      </div>
    </>
  );
}

function ServiceFormDialog({
  open,
  onOpenChange,
  service,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  service?: Service;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-start">
          <DialogTitle>{service ? "تعديل الخدمة" : "خدمة جديدة"}</DialogTitle>
        </DialogHeader>
        {open ? (
          <ServiceFormInner key={service?.id ?? "new"} service={service} close={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function ServicesView() {
  const services = useStore((s) => s.services);
  const categories = useStore((s) => s.serviceCategories);
  const deleteService = useStore((s) => s.deleteService);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; service?: Service }>({ open: false });

  const q = search.trim();
  const groups = useMemo(() => {
    const match = (s: Service) => (q ? s.name.includes(q) || s.notes.includes(q) : true);
    const grouped = categories.map((cat) => ({
      cat,
      items: services.filter((s) => s.categoryId === cat.id && match(s)),
    }));
    const uncategorized = services.filter((s) => !s.categoryId && match(s));
    return { grouped, uncategorized };
  }, [services, categories, q]);

  const isEmpty = groups.grouped.every((g) => g.items.length === 0) && groups.uncategorized.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في الخدمات…" className="ps-8" />
        </div>
        <Button className="ms-auto shrink-0" onClick={() => setDialog({ open: true })}>
          <Plus className="size-4" /> خدمة جديدة
        </Button>
      </div>

      <p className="rounded-lg border bg-card p-3 text-xs text-muted-foreground">
        الخدمات الرقمية هي الأساس، أما خدمات التصميم والطباعة فهي خدمات ثانوية — رتّبنا القوائم على هذا الأساس.
      </p>

      {isEmpty ? (
        <EmptyState
          icon={Briefcase}
          title={services.length === 0 ? "لا خدمات بعد" : "لا نتائج مطابقة"}
          hint="عرّف الخدمات التي تقدمها بأسعارها لتقترحها على عملاءك بسرعة"
        />
      ) : (
        <div className="space-y-5">
          {groups.grouped.map(({ cat, items }) =>
            items.length === 0 ? null : (
              <section key={cat.id}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-bold">{cat.name}</h3>
                  {cat.primary ? (
                    <Badge className="gap-1 border-0 bg-primary text-primary-foreground">
                      <Sparkles className="size-3" /> الأساس
                    </Badge>
                  ) : (
                    <Badge variant="secondary">ثانوية</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <ul className="divide-y">
                      {items.map((s) => (
                        <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{s.name}</p>
                            {s.notes ? <p className="truncate text-xs text-muted-foreground">{s.notes}</p> : null}
                          </div>
                          <Badge variant="outline" className="shrink-0 border-primary/30 font-bold text-primary">
                            {fmtMoney(s.price)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-muted-foreground"
                            onClick={() => setDialog({ open: true, service: s })}
                            aria-label="تعديل"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <ConfirmDelete itemLabel="الخدمة" onConfirm={() => deleteService(s.id)} />
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            )
          )}

          {groups.uncategorized.length > 0 ? (
            <section>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-bold">خدمات بلا تصنيف</h3>
                <span className="text-xs text-muted-foreground">({groups.uncategorized.length})</span>
              </div>
              <Card>
                <CardContent className="p-0">
                  <ul className="divide-y">
                    {groups.uncategorized.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{s.name}</p>
                          {s.notes ? <p className="truncate text-xs text-muted-foreground">{s.notes}</p> : null}
                        </div>
                        <Badge variant="outline" className="shrink-0 border-primary/30 font-bold text-primary">
                          {fmtMoney(s.price)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-muted-foreground"
                          onClick={() => setDialog({ open: true, service: s })}
                          aria-label="تعديل"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <ConfirmDelete itemLabel="الخدمة" onConfirm={() => deleteService(s.id)} />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          ) : null}
        </div>
      )}

      <ServiceFormDialog open={dialog.open} onOpenChange={(v) => setDialog({ open: v })} service={dialog.service} />
    </div>
  );
}
