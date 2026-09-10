"use client";

import {
  ALargeSmall,
  Briefcase,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  FolderKanban,
  Globe,
  KeyRound,
  List,
  LoaderCircle,
  Moon,
  Pencil,
  PlugZap,
  Plus,
  Trash2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import { MODEL_HINTS, MODEL_SUGGESTIONS, PROVIDER_LABELS, normalizeModelName } from "@/lib/ai";
import type { AIProvider } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DigitalClock, useClockFormat } from "./clock";
import type { NavFn } from "./nav-types";

/* ---------- خيارات حجم الخط ---------- */
const FONT_SCALES = [
  { value: 90, label: "صغير", sample: "text-sm" },
  { value: 100, label: "عادي", sample: "text-base" },
  { value: 110, label: "كبير", sample: "text-lg" },
  { value: 125, label: "أكبر", sample: "text-xl" },
] as const;

/* ---------- مدير التصنيفات ---------- */
function CategoryManager({
  title,
  kind,
}: {
  title: string;
  kind: "project" | "service";
}) {
  const categories = useStore((s) => (kind === "project" ? s.projectCategories : s.serviceCategories));
  const addCategory = useStore((s) => (kind === "project" ? s.addProjectCategory : s.addServiceCategory));
  const renameCategory = useStore((s) => (kind === "project" ? s.renameProjectCategory : s.renameServiceCategory));
  const deleteCategory = useStore((s) => (kind === "project" ? s.deleteProjectCategory : s.deleteServiceCategory));

  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const addItem = () => {
    const n = name.trim();
    if (!n) return;
    addCategory(n);
    setName("");
    toast.success(`تمت إضافة «${n}»`);
  };

  const saveRename = () => {
    if (!editingId) return;
    const n = editingName.trim();
    if (!n) return;
    renameCategory(editingId, n);
    setEditingId(null);
    toast.success("تم تعديل الاسم");
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          {kind === "project" ? (
            <FolderKanban className="size-4.5 text-primary" />
          ) : (
            <Briefcase className="size-4.5 text-primary" />
          )}
          <h3 className="font-bold">{title}</h3>
          <Badge variant="secondary">{categories.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="اسم تصنيف جديد…"
          />
          <Button variant="outline" onClick={addItem} className="shrink-0">
            <Plus className="size-4" /> إضافة
          </Button>
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا تصنيفات — أضف أول تصنيف</p>
        ) : (
          <ul className="divide-y">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2">
                {editingId === c.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveRename()}
                      className="h-8 flex-1"
                      autoFocus
                    />
                    <Button size="sm" onClick={saveRename} className="h-8 shrink-0">
                      حفظ
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 shrink-0" onClick={() => setEditingId(null)}>
                      إلغاء
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{c.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditingName(c.name);
                      }}
                      aria-label="إعادة تسمية"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        deleteCategory(c.id);
                        toast.success("تم حذف التصنيف");
                      }}
                      aria-label="حذف التصنيف"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          حذف التصنيف لا يحذف العناصر المرتبطة به — تصبح بلا تصنيف فقط.
        </p>
      </CardContent>
    </Card>
  );
}

/* ---------- بطاقة مفتاح الذكاء الاصطناعي ---------- */
function AiKeyCard() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const ai = settings.ai ?? { provider: "google" as AIProvider, model: "", apiKey: "", baseUrl: "", notes: "" };

  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[] | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);

  /** تحديث حقل ضمن إعدادات الذكاء الاصطناعي — يُحفظ محليًا فورًا */
  const patchAi = (patch: Partial<typeof ai>) => {
    updateSettings({ ai: { ...ai, ...patch } });
  };

  const copyKey = async () => {
    if (!ai.apiKey) return;
    try {
      await navigator.clipboard.writeText(ai.apiKey);
      toast.success("تم نسخ المفتاح");
    } catch {
      toast.error("تعذّر النسخ من المتصفح");
    }
  };

  /** جلب الموديلات المتاحة فعليًا لدى المزوّد لهذا المفتاح */
  const fetchModels = async () => {
    if (!ai.apiKey.trim()) {
      toast.error("أدخل المفتاح أولًا");
      return;
    }
    setLoadingModels(true);
    try {
      const res = await fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: ai.provider, apiKey: ai.apiKey.trim(), baseUrl: ai.baseUrl }),
      });
      const data = (await res.json()) as { ok?: boolean; models?: string[]; error?: string };
      if (data?.ok && data.models?.length) {
        setFetchedModels(data.models);
        toast.success(`تم جلب ${data.models.length} موديل — اختر من القائمة`);
      } else {
        toast.error("تعذّر جلب الموديلات", { description: data?.error ?? `رمز الحالة ${res.status}` });
      }
    } catch {
      toast.error("تعذّر الوصول إلى خدمة الاتصال المحلية");
    } finally {
      setLoadingModels(false);
    }
  };

  const testConnection = async () => {
    // تطبيع الاسم المحفوظ أولًا (مسافات/أحرف كبيرة/محارف خفية) ثم التحقق
    const cleanModel = normalizeModelName(ai.provider, ai.model);
    if (cleanModel && cleanModel !== ai.model) patchAi({ model: cleanModel });
    if (!cleanModel || !ai.apiKey.trim()) {
      toast.error("أدخل اسم الموديل والمفتاح أولًا");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: ai.provider,
          model: cleanModel,
          apiKey: ai.apiKey.trim(),
          baseUrl: ai.baseUrl,
          system: "أجب بإيجاز شديد.",
          messages: [{ role: "user", content: "قل فقط: تم بنجاح" }],
        }),
      });
      const data = (await res.json()) as { ok?: boolean; text?: string; error?: string };
      if (data?.ok) {
        toast.success("الاتصال يعمل بنجاح", { description: `رد الموديل: ${data.text?.slice(0, 60)}` });
      } else {
        toast.error("فشل الاتصال", { description: data?.error ?? `رمز الحالة ${res.status}` });
      }
    } catch {
      toast.error("تعذّر الوصول إلى خدمة الاتصال المحلية");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <KeyRound className="size-4.5 text-primary" />
          <div className="flex-1">
            <h3 className="font-bold">مفتاح الذكاء الاصطناعي</h3>
            <p className="text-xs text-muted-foreground">لتشغيل المساعد الذكي — يُحفظ على جهازك فقط</p>
          </div>
        </div>

        {/* المزوّد */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">المزوّد</label>
          <Select value={ai.provider} onValueChange={(v) => { patchAi({ provider: v as AIProvider }); setFetchedModels(null); }} dir="rtl">
            <SelectTrigger className="w-full" aria-label="اختيار المزوّد">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PROVIDER_LABELS) as AIProvider[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* اسم الموديل */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">اسم الموديل</label>
          <Input
            value={ai.model}
            onChange={(e) => patchAi({ model: e.target.value })}
            onBlur={() => {
              const n = normalizeModelName(ai.provider, ai.model);
              if (n && n !== ai.model) patchAi({ model: n });
            }}
            placeholder={MODEL_HINTS[ai.provider]}
            dir="ltr"
            className="text-start"
          />
          {/* اختيار سريع من موديلات شائعة صحيحة */}
          {MODEL_SUGGESTIONS[ai.provider].length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {MODEL_SUGGESTIONS[ai.provider].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => patchAi({ model: m })}
                  aria-pressed={ai.model === m}
                  className={cn(
                    "rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
                    ai.model === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                  dir="ltr"
                >
                  {m}
                </button>
              ))}
            </div>
          ) : null}
          {/* موديلات مُجلوبة فعليًا من المزوّد */}
          {fetchedModels && fetchedModels.length > 0 ? (
            <Select dir="rtl" onValueChange={(v) => { if (v) patchAi({ model: v }); }}>
              <SelectTrigger className="w-full" aria-label="اختيار من موديلات المزوّد">
                <SelectValue placeholder={`اختر من ${fetchedModels.length} موديل متاح…`} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {fetchedModels.map((m) => (
                  <SelectItem key={m} value={m} className="font-mono text-xs" dir="ltr">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        {/* عنوان الخدمة لمزوّد آخر */}
        {ai.provider === "custom" ? (
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">عنوان الخدمة (Base URL)</label>
            <Input
              value={ai.baseUrl ?? ""}
              onChange={(e) => patchAi({ baseUrl: e.target.value })}
              placeholder="https://example.com/v1"
              dir="ltr"
              className="text-start"
            />
            <button
              type="button"
              onClick={() => patchAi({ baseUrl: "https://openrouter.ai/api/v1" })}
              aria-pressed={(ai.baseUrl ?? "").includes("openrouter")}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                (ai.baseUrl ?? "").includes("openrouter")
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              <Globe className="me-1 inline size-3" />
              تعبئة OpenRouter تلقائيًا — يوفّر Gemini وGPT وClaude ويتجاوز الحظر الجغرافي
            </button>
            <p className="text-[11px] leading-snug text-muted-foreground">
              أي خدمة متوافقة مع واجهة OpenAI. إن حصل حظر جغرافي مع Google مباشرة: أنشئ مفتاحًا من openrouter.ai
              (فيه موديلات مجانية)، اضغط زر التعبئة أعلاه، ثم اختر موديلًا بصيغة google/gemini-…
            </p>
          </div>
        ) : null}

        {/* المفتاح */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">المفتاح</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                value={ai.apiKey}
                onChange={(e) => patchAi({ apiKey: e.target.value })}
                placeholder="••••••••••••"
                dir="ltr"
                className="text-start pe-10"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? "إخفاء المفتاح" : "إظهار المفتاح"}
                className="absolute inset-y-0 end-2 my-auto flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copyKey}
              disabled={!ai.apiKey}
              aria-label="نسخ المفتاح"
              className="shrink-0"
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </div>

        {/* ملاحظة اختيارية */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">ملاحظة (اختياري)</label>
          <Textarea
            value={ai.notes ?? ""}
            onChange={(e) => patchAi({ notes: e.target.value })}
            placeholder="مثلًا: هذا مفتاح الحساب المجاني — تجنب الاستخدام الكثيف…"
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={testConnection} disabled={testing} className="shrink-0">
            {testing ? <LoaderCircle className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
            {testing ? "جارٍ الاختبار…" : "اختبار الاتصال"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchModels}
            disabled={loadingModels || !ai.apiKey.trim()}
            className="shrink-0"
          >
            {loadingModels ? <LoaderCircle className="size-4 animate-spin" /> : <List className="size-4" />}
            {loadingModels ? "جارٍ الجلب…" : "جلب الموديلات"}
          </Button>
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          يُحفظ المفتاح محليًا على جهازك، ولا يُرسل إلا للمزوّد عند استخدام المساعد الذكي.
        </p>
      </CardContent>
    </Card>
  );
}

export function SettingsView({ navigate }: { navigate: NavFn }) {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);
  const services = useStore((s) => s.services);
  const fontScale = settings.fontScale ?? 100;
  const clockFormat = useClockFormat();
  const { resolvedTheme, setTheme } = useTheme();

  const [stages, setStages] = useState<[string, string, string]>(settings.stageNames);

  const saveStages = () => {
    const clean = stages.map((s) => s.trim() || "مرحلة") as [string, string, string];
    updateSettings({ stageNames: clean });
    setStages(clean);
    toast.success("تم حفظ أسماء المراحل");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <CategoryManager title="تصنيفات المشاريع" kind="project" />
      <CategoryManager title="تصنيفات الخدمات" kind="service" />

      {/* الخدمات */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Briefcase className="size-4.5 text-primary" />
          <div className="flex-1">
            <h3 className="font-bold">الخدمات</h3>
            <p className="text-xs text-muted-foreground">{services.length} خدمة معرّفة بأسعارها</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("services")}>
            إدارة الخدمات
          </Button>
        </CardContent>
      </Card>

      {/* المراحل */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <h3 className="font-bold">أسماء مراحل تطوير المشاريع</h3>
          <p className="text-xs text-muted-foreground">ثلاث مراحل ثابتة — يمكنك تسميتها كما يناسب أسلوب عملك</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {stages.map((s, i) => (
              <div key={i} className="space-y-1">
                <label className="text-xs text-muted-foreground">المرحلة {i + 1}</label>
                <Input
                  value={s}
                  onChange={(e) => setStages(stages.map((x, j) => (j === i ? e.target.value : x)) as [string, string, string])}
                />
              </div>
            ))}
          </div>
          <Button size="sm" onClick={saveStages}>
            حفظ الأسماء
          </Button>
        </CardContent>
      </Card>

      {/* المظهر */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Moon className="size-4.5 text-primary" />
          <div className="flex-1">
            <h3 className="font-bold">الوضع الليلي</h3>
            <p className="text-xs text-muted-foreground">مريح للعين في الإضاءة المنخفضة</p>
          </div>
          <Switch
            checked={resolvedTheme === "dark"}
            onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
            aria-label="تبديل الوضع الليلي"
          />
        </CardContent>
      </Card>

      {/* حجم الخط */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <ALargeSmall className="size-4.5 text-primary" />
            <div className="flex-1">
              <h3 className="font-bold">حجم الخط</h3>
              <p className="text-xs text-muted-foreground">اضبط حجم الخط في التطبيق كاملاً — يُحفظ تلقائيًا</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {FONT_SCALES.map((o) => {
              const active = fontScale === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => updateSettings({ fontScale: o.value })}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <span className={cn("font-extrabold leading-none", o.sample)}>أأ</span>
                  <span className="text-[11px] font-medium">{o.label}</span>
                  <span className="text-[10px] text-muted-foreground">{o.value}%</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* نمط الساعة */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <Clock3 className="size-4.5 text-primary" />
            <div className="flex-1">
              <h3 className="font-bold">نمط الساعة</h3>
              <p className="text-xs text-muted-foreground">يُطبّق على الساعة الرقمية وأوقات المهام</p>
            </div>
            <DigitalClock size="sm" className="shrink-0" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: "12", label: "12 ساعة", example: "02:35 م" },
              { value: "24", label: "24 ساعة", example: "14:35" },
            ] as const).map((o) => {
              const active = clockFormat === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => updateSettings({ clockFormat: o.value })}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2.5 transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <span className="text-sm font-bold">{o.label}</span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums" dir="ltr">
                    {o.example}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* مفتاح الذكاء الاصطناعي */}
      <AiKeyCard />

      {/* منطقة الخطر */}
      <Card className="border-destructive/40">
        <CardContent className="flex items-center gap-3 p-4">
          <Trash2 className="size-4.5 text-destructive" />
          <div className="flex-1">
            <h3 className="font-bold text-destructive">مسح جميع البيانات</h3>
            <p className="text-xs text-muted-foreground">
              حذف كل المشاريع والعملاء والزيارات والمهام والملاحظات — لا يمكن التراجع
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="shrink-0">
                مسح الكل
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader className="text-right">
                <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم مسح جميع بيانات التطبيق نهائيًا من هذا الجهاز. تظل تصنيفات المشاريع والخدمات الافتراضية محفوظة.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-2">
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => {
                    resetAll();
                    toast.success("تم مسح جميع البيانات");
                  }}
                >
                  نعم، امسح كل شيء
                </AlertDialogAction>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
