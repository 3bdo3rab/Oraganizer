"use client";

import {
  ArrowLeft,
  Briefcase,
  CalendarClock,
  Footprints,
  ListTodo,
  MapPin,
  Pencil,
  Plus,
  Users,
} from "lucide-react";
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
import { makeClient, useStore } from "@/lib/store";
import { fmtDate, relDay, todayStr } from "@/lib/utils-app";
import { cn } from "@/lib/utils";
import { CLIENT_STATUSES, type Client, type ClientStatus, type Visit } from "@/lib/types";
import { ConfirmDelete, DateInput, EmptyState, Field, InfoRow, PhoneLink, SectionTitle, StatusBadge } from "./shared";
import { TaskFormDialog } from "./task-form";
import { VisitFormDialog } from "./visit-form";
import type { NavFn } from "./nav-types";

/* ================= نموذج العميل ================= */
function ClientFormInner({
  client,
  close,
}: {
  client?: Client;
  close: () => void;
}) {
  const projects = useStore((s) => s.projects);
  const services = useStore((s) => s.services);
  const categories = useStore((s) => s.projectCategories);
  const addClient = useStore((s) => s.addClient);
  const updateClient = useStore((s) => s.updateClient);
  const [form, setForm] = useState<Client>(() => (client ? { ...client } : makeClient()));
  const [err, setErr] = useState("");

  const save = () => {
    if (!form.name.trim()) return setErr("اكتب اسم العميل أو المنشأة");
    const clean = { ...form, name: form.name.trim() };
    if (client) {
      updateClient(client.id, clean);
      toast.success("تم حفظ التعديلات");
    } else {
      addClient(clean);
      toast.success("تمت إضافة العميل");
    }
    close();
  };

  const set = (patch: Partial<Client>) => setForm((f) => ({ ...f, ...patch }));
  const toggleService = (sid: string) =>
    set({
      serviceIds: form.serviceIds.includes(sid)
        ? form.serviceIds.filter((x) => x !== sid)
        : [...form.serviceIds, sid],
    });

  return (
    <>
      <div className="space-y-4">
        <Field label="الاسم *">
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="اسم العميل أو المنشأة" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="التصنيف" hint="اختر أو اكتب تصنيفًا">
              <Input
                value={form.category}
                onChange={(e) => set({ category: e.target.value })}
                list="client-cats"
                placeholder="مثال: مجمع عيادات"
              />
              <datalist id="client-cats">
                {categories.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </Field>
            <Field label="الموقع">
              <Input value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="الحي — أقرب معلم" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الهاتف الأساسي">
              <Input dir="ltr" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="09…" />
            </Field>
            <Field label="الحالة">
              <Select value={form.status} onValueChange={(v) => set({ status: v as ClientStatus })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="أرقام إضافية (اختياري)">
            <div className="space-y-2">
              {form.extraPhones.map((num, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    dir="ltr"
                    value={num}
                    onChange={(e) =>
                      set({ extraPhones: form.extraPhones.map((x, j) => (j === i ? e.target.value : x)) })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => set({ extraPhones: form.extraPhones.filter((_, j) => j !== i) })}
                    aria-label="حذف الرقم"
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => set({ extraPhones: [...form.extraPhones, ""] })}>
                <Plus className="size-4" /> رقم إضافي
              </Button>
            </div>
          </Field>
          <Field label="المشروع المناسب له">
            <Select
              value={form.suitableProjectId ?? "none"}
              onValueChange={(v) => set({ suitableProjectId: v === "none" ? undefined : v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر مشروعًا" />
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
          </Field>
          <Field label="الخدمات القابلة للعرض عليه" hint="تُختار من «خدماتي» — اضغط للاختيار">
            <div className="flex flex-wrap gap-1.5">
              {services.map((sv) => {
                const active = form.serviceIds.includes(sv.id);
                return (
                  <button
                    key={sv.id}
                    type="button"
                    onClick={() => toggleService(sv.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {sv.name}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="موعد المتابعة">
            <DateInput value={form.followUpDate} onChange={(v) => set({ followUpDate: v })} />
          </Field>
          <Field label="ملاحظات">
            <Textarea rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
      </div>
      <div className="mt-4 flex flex-row-reverse gap-2">
        <Button onClick={save}>{client ? "حفظ التعديل" : "إضافة العميل"}</Button>
        <Button variant="outline" onClick={close}>
          إلغاء
        </Button>
      </div>
    </>
  );
}

function ClientFormDialog({
  open,
  onOpenChange,
  client,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  client?: Client;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" dir="rtl">
        <DialogHeader className="text-start">
          <DialogTitle>{client ? "تعديل العميل" : "عميل محتمل جديد"}</DialogTitle>
        </DialogHeader>
        {open ? (
          <ClientFormInner key={client?.id ?? "new"} client={client} close={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/* ================= بطاقة زيارة ================= */
function VisitCard({ visit, onEdit }: { visit: Visit; onEdit: () => void }) {
  const deleteVisit = useStore((s) => s.deleteVisit);
  return (
    <div className="relative rounded-lg border bg-card p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge className="gap-1 bg-primary/10 text-primary border-0">
          <CalendarClock className="size-3" />
          {fmtDate(visit.date)} — {relDay(visit.date)}
        </Badge>
        {visit.followUpDate ? (
          <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300 dark:border-amber-800">
            متابعة: {fmtDate(visit.followUpDate)} ({relDay(visit.followUpDate)})
          </Badge>
        ) : null}
        <div className="ms-auto flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" onClick={onEdit} aria-label="تعديل الزيارة">
            <Pencil className="size-3.5" />
          </Button>
          <ConfirmDelete itemLabel="الزيارة" onConfirm={() => deleteVisit(visit.id)} className="size-7" />
        </div>
      </div>
      <div className="space-y-1.5">
        <InfoRow label="النتيجة" value={visit.result} />
        <InfoRow label="طلب العميل" value={visit.clientRequest} />
        <InfoRow label="على المشروع" value={visit.projectNotes} />
        <InfoRow label="لتحسين البيع" value={visit.marketingNotes} />
        <InfoRow label="ملاحظات عامة" value={visit.generalNotes} />
      </div>
    </div>
  );
}

/* ================= تفاصيل العميل ================= */
function ClientDetail({ id, onBack, navigate }: { id: string; onBack: () => void; navigate: NavFn }) {
  const client = useStore((s) => s.clients.find((c) => c.id === id));
  const projects = useStore((s) => s.projects);
  const services = useStore((s) => s.services);
  const visits = useStore((s) => s.visits);
  const tasks = useStore((s) => s.tasks);
  const updateClient = useStore((s) => s.updateClient);
  const deleteClient = useStore((s) => s.deleteClient);
  const addVisit = useStore((s) => s.addVisit);

  const [editOpen, setEditOpen] = useState(false);
  const [visitDialog, setVisitDialog] = useState<{ open: boolean; visit?: Visit }>({ open: false });
  const [taskDialog, setTaskDialog] = useState(false);

  if (!client) {
    return <EmptyState icon={Users} title="العميل غير موجود" action={<Button onClick={onBack}>عودة</Button>} />;
  }

  const clientVisits = visits
    .filter((v) => v.clientId === client.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const clientTasks = tasks.filter((t) => t.clientId === client.id && !t.completed);
  const project = projects.find((p) => p.id === client.suitableProjectId);
  const offeredServices = services.filter((s) => client.serviceIds.includes(s.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4 rotate-180" /> عودة
        </Button>
        <h2 className="text-xl font-extrabold">{client.name}</h2>
        <StatusBadge status={client.status} />
        <div className="ms-auto flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> تعديل
          </Button>
          <ConfirmDelete
            itemLabel="العميل وكل سجلات زياراته"
            onConfirm={() => {
              deleteClient(client.id);
              onBack();
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* البيانات */}
        <Card>
          <CardContent className="space-y-2 p-4">
            <SectionTitle icon={Users} title="بيانات العميل" />
            <InfoRow label="التصنيف" value={client.category} />
            <InfoRow
              label="الموقع"
              value={
                client.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 text-muted-foreground" /> {client.location}
                  </span>
                ) : undefined
              }
            />
            <InfoRow
              label="الهاتف"
              value={
                client.phone ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <PhoneLink number={client.phone} />
                    {client.extraPhones.filter(Boolean).map((p, i) => (
                      <PhoneLink key={i} number={p} />
                    ))}
                  </span>
                ) : undefined
              }
            />
            <InfoRow label="أضيف في" value={fmtDate(client.createdAt.slice(0, 10))} />
            {client.notes ? <InfoRow label="ملاحظات" value={client.notes} /> : null}
          </CardContent>
        </Card>

        {/* الربط */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <SectionTitle icon={Briefcase} title="الفرصة التجارية" />
            <div>
              <p className="mb-1 text-xs text-muted-foreground">المشروع المناسب له</p>
              {project ? (
                <button
                  className="w-full rounded-lg border p-2.5 text-start text-sm font-medium hover:border-primary/50 hover:text-primary"
                  onClick={() => navigate("projects", { projectId: project.id })}
                >
                  {project.name}
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">لم يُحدد مشروع بعد</p>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">الخدمات القابلة للعرض ({offeredServices.length})</p>
              {offeredServices.length === 0 ? (
                <p className="text-sm text-muted-foreground">لم تُحدد خدمات بعد</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {offeredServices.map((s) => (
                    <Badge key={s.id} variant="secondary">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 dark:border-amber-800 dark:bg-amber-950/40">
              <p className="mb-1 text-xs font-medium text-amber-800 dark:text-amber-300">موعد المتابعة</p>
              <div className="flex items-center gap-2">
                <DateInput
                  value={client.followUpDate}
                  onChange={(v) => updateClient(client.id, { followUpDate: v })}
                  className="h-8 w-40"
                />
                {client.followUpDate ? (
                  <span className="text-xs text-muted-foreground">{relDay(client.followUpDate)}</span>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* سجل الزيارات */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-3 p-4">
            <SectionTitle
              icon={Footprints}
              title={`سجل الزيارات (${clientVisits.length})`}
              extra={
                <Button size="sm" onClick={() => setVisitDialog({ open: true })}>
                  <Plus className="size-4" /> زيارة جديدة
                </Button>
              }
            />
            {clientVisits.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                لا زيارات مسجلة لهذا العميل — وثّق أول زيارة لتتابع التعامل معه خطوة بخطوة
              </p>
            ) : (
              <ol className="relative space-y-3 border-s-2 ps-4">
                {clientVisits.map((v) => (
                  <li key={v.id} className="relative">
                    <span className="absolute -start-[21.5px] top-4 size-3 rounded-full border-2 border-primary bg-background" />
                    <VisitCard visit={v} onEdit={() => setVisitDialog({ open: true, visit: v })} />
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* مهام العميل */}
        {clientTasks.length > 0 ? (
          <Card className="lg:col-span-2">
            <CardContent className="space-y-2 p-4">
              <SectionTitle
                icon={ListTodo}
                title="مهام مرتبطة بالعميل"
                extra={
                  <Button variant="outline" size="sm" onClick={() => setTaskDialog(true)}>
                    <Plus className="size-4" /> مهمة
                  </Button>
                }
              />
              <ul className="divide-y">
                {clientTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 py-1.5 text-sm">
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <Badge variant="secondary">{fmtDate(t.date)}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} client={client} />
      <VisitFormDialog
        open={visitDialog.open}
        onOpenChange={(v) => setVisitDialog({ open: v })}
        visit={visitDialog.visit}
        fixedClientId={client.id}
      />
      <TaskFormDialog open={taskDialog} onOpenChange={setTaskDialog} defaults={{ clientId: client.id }} />
    </div>
  );
}

/* ================= قائمة العملاء ================= */
export function ClientsView({
  focusId,
  onFocusChange,
  navigate,
}: {
  focusId?: string | null;
  onFocusChange: (id: string | null) => void;
  navigate: NavFn;
}) {
  const clients = useStore((s) => s.clients);
  const projects = useStore((s) => s.projects);
  const visits = useStore((s) => s.visits);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const today = todayStr();

  const filtered = useMemo(() => {
    return [...clients]
      .sort((a, b) => (a.followUpDate ?? "9999").localeCompare(b.followUpDate ?? "9999"))
      .filter((c) => (statusFilter === "all" ? true : c.status === statusFilter))
      .filter((c) =>
        search.trim()
          ? c.name.includes(search.trim()) ||
            c.category.includes(search.trim()) ||
            c.location.includes(search.trim())
          : true
      );
  }, [clients, search, statusFilter]);

  if (focusId) {
    return <ClientDetail id={focusId} onBack={() => onFocusChange(null)} navigate={navigate} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو التصنيف أو الموقع…"
          className="w-full sm:w-64"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {CLIENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setDialogOpen(true)} className="ms-auto shrink-0">
          <Plus className="size-4" /> عميل جديد
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={clients.length === 0 ? "لا عملاء محتملين بعد" : "لا نتائج مطابقة"}
          hint={
            clients.length === 0
              ? "أضف أشخاصًا أو منشآت يمكن أن تبيع لها مشاريعك وخدماتك"
              : "جرّب تغيير البحث أو التصفية"
          }
          action={clients.length === 0 ? <Button onClick={() => setDialogOpen(true)}>إضافة عميل</Button> : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const project = projects.find((p) => p.id === c.suitableProjectId);
            const visitsCount = visits.filter((v) => v.clientId === c.id).length;
            const due = c.followUpDate && c.followUpDate <= today;
            return (
              <button key={c.id} className="text-start" onClick={() => onFocusChange(c.id)}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold">{c.name}</p>
                      <StatusBadge status={c.status} className="shrink-0" />
                    </div>
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      {c.category ? <p>{c.category}</p> : null}
                      {c.location ? (
                        <p className="inline-flex items-center gap-1">
                          <MapPin className="size-3" /> {c.location}
                        </p>
                      ) : null}
                    </div>
                    {project ? (
                      <Badge variant="outline" className="text-primary border-primary/30">
                        {project.name}
                      </Badge>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-1.5 border-t pt-2 text-[11px] text-muted-foreground">
                      {c.followUpDate ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            due
                              ? "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
                              : "border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300"
                          )}
                        >
                          متابعة: {relDay(c.followUpDate)}
                        </Badge>
                      ) : null}
                      <span>{visitsCount} زيارة</span>
                      {c.phone ? (
                        <span dir="ltr" className="font-mono">
                          {c.phone}
                        </span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <ClientFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
