"use client";

import {
  ArrowLeft,
  Bot,
  DollarSign,
  ExternalLink,
  FolderKanban,
  Link2,
  ListTodo,
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
import { makeProject, projectTotal, useStore } from "@/lib/store";
import { fmtMoney, fmtMoneyOrZero, uid } from "@/lib/utils-app";
import type { Project, StageIndex } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ConfirmDelete, EmptyState, Field, SectionTitle } from "./shared";
import { TaskFormDialog } from "./task-form";
import type { NavFn } from "./nav-types";

/* ================= نموذج المشروع ================= */
function ProjectFormInner({
  project,
  close,
}: {
  project?: Project;
  close: () => void;
}) {
  const categories = useStore((s) => s.projectCategories);
  const addProject = useStore((s) => s.addProject);
  const updateProject = useStore((s) => s.updateProject);
  const [form, setForm] = useState<Project>(() => (project ? { ...project } : makeProject()));
  const [err, setErr] = useState("");

  const save = () => {
    if (!form.name.trim()) return setErr("اكتب اسم المشروع");
    const clean = { ...form, name: form.name.trim() };
    if (project) {
      updateProject(project.id, clean);
      toast.success("تم حفظ التعديلات");
    } else {
      addProject(clean);
      toast.success("تمت إضافة المشروع");
    }
    close();
  };

  const set = (patch: Partial<Project>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <>
      <div className="space-y-4">
        <Field label="اسم المشروع *">
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="مثال: لوحة تحكم مجمع عيادات" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="التصنيف">
              <Select value={form.categoryId ?? "none"} onValueChange={(v) => set({ categoryId: v === "none" ? undefined : v })}>
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
            <Field label="المرحلة الحالية">
              <Select value={String(form.stage)} onValueChange={(v) => set({ stage: Number(v) as StageIndex })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">1 — التصميم والتجهيز</SelectItem>
                  <SelectItem value="1">2 — البناء والتطوير</SelectItem>
                  <SelectItem value="2">3 — الاختبار والتسليم</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="الوصف">
            <Textarea rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
          <Field label="السعر الأساسي ($)">
            <Input
              type="number"
              dir="ltr"
              min={0}
              value={form.basePrice || ""}
              onChange={(e) => set({ basePrice: Number(e.target.value) || 0 })}
              placeholder="0"
            />
          </Field>
          <div className="rounded-lg border p-3">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold">
              <Bot className="size-4 text-primary" /> معلومات تطوير المشروع
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="وكيل الذكاء الاصطناعي">
                  <Input value={form.agentName} onChange={(e) => set({ agentName: e.target.value })} placeholder="مثال: Claude Code" />
                </Field>
                <Field label="النموذج المستخدم">
                  <Input value={form.agentModel} onChange={(e) => set({ agentModel: e.target.value })} />
                </Field>
              </div>
              <Field label="رابط الوكيل">
                <Input dir="ltr" value={form.agentUrl} onChange={(e) => set({ agentUrl: e.target.value })} placeholder="https://…" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="بيئة / محرر البرمجة">
                  <Input value={form.editor} onChange={(e) => set({ editor: e.target.value })} placeholder="VS Code" />
                </Field>
                <Field label="مسار المشروع على الجهاز">
                  <Input dir="ltr" value={form.localPath} onChange={(e) => set({ localPath: e.target.value })} />
                </Field>
              </div>
            </div>
          </div>
          <Field label="ملاحظات المشروع">
            <Textarea rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
      </div>
      <div className="mt-4 flex flex-row-reverse gap-2">
        <Button onClick={save}>{project ? "حفظ التعديل" : "إضافة المشروع"}</Button>
        <Button variant="outline" onClick={close}>
          إلغاء
        </Button>
      </div>
    </>
  );
}

function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: Project;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" dir="rtl">
        <DialogHeader className="text-start">
          <DialogTitle>{project ? "تعديل المشروع" : "مشروع جديد"}</DialogTitle>
        </DialogHeader>
        {open ? (
          <ProjectFormInner key={project?.id ?? "new"} project={project} close={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/* ================= بطاقة مرحلة (3 مراحل فقط) ================= */
function StageStepper({
  stage,
  onChange,
}: {
  stage: StageIndex;
  onChange: (s: StageIndex) => void;
}) {
  const names = useStore((s) => s.settings.stageNames);
  return (
    <div className="flex items-center gap-1">
      {names.map((name, i) => (
        <button
          key={i}
          onClick={() => onChange(i as StageIndex)}
          className={cn(
            "flex-1 rounded-lg border px-2 py-2 text-center text-[11px] font-bold transition-colors sm:text-xs",
            i < stage
              ? "border-primary/30 bg-primary/10 text-primary/80"
              : i === stage
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          <span className="block text-[9px] font-normal opacity-80">المرحلة {i + 1}</span>
          {name}
        </button>
      ))}
    </div>
  );
}

/* ================= تفاصيل المشروع ================= */
function ProjectDetail({ id, onBack, navigate }: { id: string; onBack: () => void; navigate: NavFn }) {
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const categories = useStore((s) => s.projectCategories);
  const clients = useStore((s) => s.clients);
  const tasks = useStore((s) => s.tasks);
  const updateProject = useStore((s) => s.updateProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const [editOpen, setEditOpen] = useState(false);
  const [taskDialog, setTaskDialog] = useState(false);

  if (!project) {
    return <EmptyState icon={FolderKanban} title="المشروع غير موجود" action={<Button onClick={onBack}>عودة</Button>} />;
  }

  const category = categories.find((c) => c.id === project.categoryId);
  const linkedClients = clients.filter((c) => c.suitableProjectId === project.id);
  const linkedTasks = tasks.filter((t) => t.projectId === project.id && !t.completed);
  const total = projectTotal(project);

  const setLinks = (links: Project["links"]) => updateProject(project.id, { links });
  const setAdditions = (additions: Project["additions"]) => updateProject(project.id, { additions });

  return (
    <div className="space-y-4">
      {/* الترويسة */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4 rotate-180" /> عودة
        </Button>
        <h2 className="text-xl font-extrabold">{project.name}</h2>
        {category ? <Badge variant="outline">{category.name}</Badge> : null}
        <div className="ms-auto flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> تعديل
          </Button>
          <ConfirmDelete
            itemLabel="المشروع وستُفصل عنه المهام والعملاء المرتبطون"
            onConfirm={() => {
              deleteProject(project.id);
              onBack();
            }}
          />
        </div>
      </div>

      {/* المراحل الثلاث */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">مراحل التطوير — اضغط على المرحلة لتحديث موقع المشروع</p>
          <StageStepper stage={project.stage} onChange={(s) => updateProject(project.id, { stage: s })} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* الأساسيات */}
        <Card>
          <CardContent className="space-y-2 p-4">
            <SectionTitle icon={FolderKanban} title="البيانات الأساسية" />
            {project.description ? <p className="whitespace-pre-wrap text-sm">{project.description}</p> : null}
            {project.notes ? (
              <div className="rounded-lg bg-muted/60 p-2.5 text-sm whitespace-pre-wrap">{project.notes}</div>
            ) : null}
            {!project.description && !project.notes ? (
              <p className="text-sm text-muted-foreground">لا وصف ولا ملاحظات بعد</p>
            ) : null}
          </CardContent>
        </Card>

        {/* معلومات التطوير */}
        <Card>
          <CardContent className="space-y-2 p-4">
            <SectionTitle icon={Bot} title="معلومات تطوير المشروع" />
            {project.agentName ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">وكيل الذكاء الاصطناعي</span>
                <span className="font-medium">
                  {project.agentName}
                  {project.agentUrl ? (
                    <a href={project.agentUrl} target="_blank" rel="noreferrer" className="ms-1 inline-flex text-primary hover:underline">
                      <ExternalLink className="inline size-3.5" />
                    </a>
                  ) : null}
                </span>
              </div>
            ) : null}
            {project.agentModel ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">النموذج</span>
                <span className="font-medium">{project.agentModel}</span>
              </div>
            ) : null}
            {project.editor ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">محرر البرمجة</span>
                <span className="font-medium">{project.editor}</span>
              </div>
            ) : null}
            {project.localPath ? (
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="shrink-0 text-muted-foreground">المسار على الجهاز</span>
                <span dir="ltr" className="truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {project.localPath}
                </span>
              </div>
            ) : null}
            {!project.agentName && !project.agentModel && !project.editor && !project.localPath ? (
              <p className="text-sm text-muted-foreground">أضف بيانات التطوير من زر «تعديل»</p>
            ) : null}
          </CardContent>
        </Card>

        {/* الروابط */}
        <Card>
          <CardContent className="space-y-2 p-4">
            <SectionTitle
              icon={Link2}
              title="روابط المشروع"
              extra={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLinks([...project.links, { id: uid(), label: "", url: "" }])}
                >
                  <Plus className="size-4" /> رابط
                </Button>
              }
            />
            {project.links.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا روابط — أضف GitHub أو Figma أو النسخة التجريبية…</p>
            ) : (
              <ul className="space-y-2">
                {project.links.map((link) => (
                  <li key={link.id} className="flex items-center gap-2">
                    <Input
                      value={link.label}
                      onChange={(e) =>
                        setLinks(project.links.map((l) => (l.id === link.id ? { ...l, label: e.target.value } : l)))
                      }
                      placeholder="اسم الرابط"
                      className="w-28 shrink-0 sm:w-36"
                    />
                    <Input
                      dir="ltr"
                      value={link.url}
                      onChange={(e) =>
                        setLinks(project.links.map((l) => (l.id === link.id ? { ...l, url: e.target.value } : l)))
                      }
                      placeholder="https://…"
                      className="min-w-0 flex-1"
                    />
                    {link.url ? (
                      <a href={link.url} target="_blank" rel="noreferrer" aria-label="فتح الرابط" className="shrink-0">
                        <Button variant="ghost" size="icon" className="size-8 text-primary">
                          <ExternalLink className="size-4" />
                        </Button>
                      </a>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setLinks(project.links.filter((l) => l.id !== link.id))}
                      aria-label="حذف الرابط"
                    >
                      ✕
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* الأسعار */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <SectionTitle icon={DollarSign} title="السعر والإضافات" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">السعر الأساسي:</span>
              <Input
                type="number"
                dir="ltr"
                min={0}
                value={project.basePrice || ""}
                onChange={(e) => updateProject(project.id, { basePrice: Number(e.target.value) || 0 })}
                placeholder="0"
                className="w-24"
              />
              <span className="text-sm font-bold text-primary">{fmtMoneyOrZero(total)}</span>
              <span className="text-xs text-muted-foreground">الإجمالي مع الإضافات</span>
            </div>
            {project.additions.length > 0 || true ? (
              <ul className="space-y-2">
                {project.additions.map((add) => (
                  <li key={add.id} className="flex items-center gap-2">
                    <Input
                      value={add.label}
                      onChange={(e) =>
                        setAdditions(project.additions.map((a) => (a.id === add.id ? { ...a, label: e.target.value } : a)))
                      }
                      placeholder="وصف الإضافة"
                      className="min-w-0 flex-1"
                    />
                    <Input
                      type="number"
                      dir="ltr"
                      min={0}
                      value={add.price || ""}
                      onChange={(e) =>
                        setAdditions(
                          project.additions.map((a) => (a.id === add.id ? { ...a, price: Number(e.target.value) || 0 } : a))
                        )
                      }
                      placeholder="$"
                      className="w-20 shrink-0"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setAdditions(project.additions.filter((a) => a.id !== add.id))}
                      aria-label="حذف الإضافة"
                    >
                      ✕
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdditions([...project.additions, { id: uid(), label: "", price: 0 }])}
            >
              <Plus className="size-4" /> إضافة بند
            </Button>
            {project.additions.length > 0 ? (
              <div className="space-y-1 border-t pt-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>الأساسي</span>
                  <span>{fmtMoney(project.basePrice)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>الإضافات ({project.additions.length})</span>
                  <span>{fmtMoney(project.additions.reduce((a, b) => a + (b.price || 0), 0))}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>الإجمالي</span>
                  <span className="text-primary">{fmtMoneyOrZero(total)}</span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* المهام المرتبطة */}
        <Card>
          <CardContent className="space-y-2 p-4">
            <SectionTitle
              icon={ListTodo}
              title="مهام المشروع"
              extra={
                <Button variant="outline" size="sm" onClick={() => setTaskDialog(true)}>
                  <Plus className="size-4" /> مهمة
                </Button>
              }
            />
            {linkedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا مهام غير مكتملة مرتبطة بهذا المشروع</p>
            ) : (
              <ul className="divide-y">
                {linkedTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 py-1.5 text-sm">
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <Badge variant="secondary">{t.priority}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* العملاء المرتبطون */}
        <Card>
          <CardContent className="space-y-2 p-4">
            <SectionTitle icon={Users} title="العملاء المهتمون بهذا المشروع" />
            {linkedClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">لم يُربط هذا المشروع بأي عميل محتمل بعد</p>
            ) : (
              <ul className="divide-y">
                {linkedClients.map((c) => (
                  <li key={c.id}>
                    <button
                      className="flex w-full items-center justify-between py-1.5 text-sm hover:text-primary"
                      onClick={() => navigate("clients", { clientId: c.id })}
                    >
                      <span className="font-medium">{c.name}</span>
                      <Badge variant="outline">{c.status}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
      <TaskFormDialog
        open={taskDialog}
        onOpenChange={setTaskDialog}
        defaults={{ projectId: project.id }}
      />
    </div>
  );
}

/* ================= قائمة المشاريع ================= */
export function ProjectsView({
  focusId,
  onFocusChange,
  navigate,
}: {
  focusId?: string | null;
  onFocusChange: (id: string | null) => void;
  navigate: NavFn;
}) {
  const projects = useStore((s) => s.projects);
  const categories = useStore((s) => s.projectCategories);
  const stageNames = useStore((s) => s.settings.stageNames);
  const clients = useStore((s) => s.clients);
  const tasks = useStore((s) => s.tasks);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    return [...projects]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((p) => (catFilter === "all" ? true : p.categoryId === catFilter))
      .filter((p) => (stageFilter === "all" ? true : String(p.stage) === stageFilter))
      .filter((p) => (search ? p.name.includes(search.trim()) : true));
  }, [projects, search, catFilter, stageFilter]);

  if (focusId) {
    return <ProjectDetail id={focusId} onBack={() => onFocusChange(null)} navigate={navigate} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث باسم المشروع…"
          className="w-full sm:w-56"
        />
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="التصنيف" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل التصنيفات</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="المرحلة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المراحل</SelectItem>
            <SelectItem value="0">التصميم والتجهيز</SelectItem>
            <SelectItem value="1">البناء والتطوير</SelectItem>
            <SelectItem value="2">الاختبار والتسليم</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => setDialogOpen(true)}
          className="ms-auto shrink-0"
        >
          <Plus className="size-4" /> مشروع جديد
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={projects.length === 0 ? "لا مشاريع بعد" : "لا نتائج مطابقة"}
          hint={
            projects.length === 0
              ? "أضف أول مشروع وابدأ بتنظيم مراحله وروابطه وأسعاره"
              : "جرّب تغيير البحث أو التصفية"
          }
          action={projects.length === 0 ? <Button onClick={() => setDialogOpen(true)}>إضافة مشروع</Button> : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const cat = categories.find((c) => c.id === p.categoryId);
            const linked = clients.filter((c) => c.suitableProjectId === p.id).length;
            const tcount = tasks.filter((t) => t.projectId === p.id && !t.completed).length;
            return (
              <button key={p.id} className="text-start" onClick={() => onFocusChange(p.id)}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold">{p.name}</p>
                      {cat ? <Badge variant="outline" className="shrink-0">{cat.name}</Badge> : null}
                    </div>
                    {p.description ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="gap-1">
                        <span className="size-1.5 rounded-full bg-primary" />
                        {stageNames[p.stage]}
                      </Badge>
                      <Badge variant="outline" className="font-bold text-primary border-primary/30">
                        {fmtMoneyOrZero(projectTotal(p))}
                      </Badge>
                    </div>
                    <div className="flex gap-3 border-t pt-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" /> {linked} عميل
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ListTodo className="size-3" /> {tcount} مهمة
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Link2 className="size-3" /> {p.links.length} رابط
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
