"use client";

import type { LucideIcon } from "lucide-react";
import { Phone, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PRIORITY_STYLES, STATUS_STYLES } from "@/lib/utils-app";
import type { ClientStatus, StageIndex, TaskPriority } from "@/lib/types";

/* ---------- حالة فارغة ---------- */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-6" />
      </div>
      <p className="font-semibold">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-muted-foreground">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/* ---------- شارات ---------- */
export function StatusBadge({ status, className }: { status: ClientStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status], className)}>
      {status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge variant="outline" className={PRIORITY_STYLES[priority]}>
      {priority}
    </Badge>
  );
}

export function StageBadge({
  stage,
  names,
  className,
}: {
  stage: StageIndex;
  names: [string, string, string];
  className?: string;
}) {
  return (
    <Badge variant="secondary" className={cn("gap-1", className)}>
      <span className="size-1.5 rounded-full bg-primary" />
      {names[stage]}
    </Badge>
  );
}

/* ---------- حذف مع تأكيد ---------- */
export function ConfirmDelete({
  onConfirm,
  itemLabel = "هذا العنصر",
  description,
  className,
}: {
  onConfirm: () => void;
  itemLabel?: string;
  description?: string;
  className?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-8 text-muted-foreground hover:text-destructive", className)}
          aria-label="حذف"
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader className="text-right">
          <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? `سيتم حذف ${itemLabel} نهائيًا. هل أنت متأكد؟`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() => {
              onConfirm();
              toast.success("تم الحذف");
            }}
          >
            حذف
          </AlertDialogAction>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------- حقول النماذج ---------- */
export function Field({
  label,
  children,
  className,
  hint,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function DateInput({
  value,
  onChange,
  className,
  id,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  className?: string;
  id?: string;
}) {
  return (
    <Input
      id={id}
      type="date"
      dir="ltr"
      className={cn("bg-background", className)}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
    />
  );
}

export function PhoneLink({ number, className }: { number: string; className?: string }) {
  if (!number) return null;
  return (
    <a
      href={`tel:${number}`}
      dir="ltr"
      className={cn(
        "inline-flex items-center gap-1 text-sm text-primary hover:underline",
        className
      )}
    >
      <Phone className="size-3.5" />
      <span>{number}</span>
    </a>
  );
}

/* ---------- عنوان قسم ---------- */
export function SectionTitle({
  icon: Icon,
  title,
  extra,
}: {
  icon?: LucideIcon;
  title: string;
  extra?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {Icon ? <Icon className="size-4.5 text-primary" /> : null}
      <h2 className="text-base font-bold">{title}</h2>
      {extra ? <div className="ms-auto">{extra}</div> : null}
    </div>
  );
}

/* ---------- صف معلومة ---------- */
export function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  if (value === undefined || value === null || value === "" || value === "—") return null;
  return (
    <div className={cn("grid grid-cols-[110px_1fr] items-start gap-2 text-sm sm:grid-cols-[140px_1fr]", className)}>
      <span className="pt-0.5 text-muted-foreground">{label}</span>
      <span className="whitespace-pre-wrap">{value}</span>
    </div>
  );
}
