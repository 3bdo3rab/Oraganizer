"use client";

import { Briefcase, FolderKanban, Moon, Pencil, Plus, Trash2 } from "lucide-react";
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
import type { NavFn } from "./nav-types";

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

export function SettingsView({ navigate }: { navigate: NavFn }) {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);
  const services = useStore((s) => s.services);
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
