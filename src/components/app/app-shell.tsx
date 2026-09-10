"use client";

import {
  Briefcase,
  CalendarDays,
  FolderKanban,
  Footprints,
  LayoutDashboard,
  ListTodo,
  Menu,
  Moon,
  Settings,
  StickyNote,
  Sun,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { fmtTodayFull } from "@/lib/utils-app";
import { DigitalClock } from "./clock";

export type ViewKey =
  | "dashboard"
  | "tasks"
  | "calendar"
  | "projects"
  | "clients"
  | "visits"
  | "services"
  | "notes"
  | "settings";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { key: "tasks", label: "المهام", icon: ListTodo },
  { key: "calendar", label: "التقويم", icon: CalendarDays },
  { key: "projects", label: "مشاريعي", icon: FolderKanban },
  { key: "clients", label: "العملاء", icon: Users },
  { key: "visits", label: "الزيارات", icon: Footprints },
  { key: "services", label: "خدماتي", icon: Briefcase },
  { key: "notes", label: "الملاحظات", icon: StickyNote },
  { key: "settings", label: "الإعدادات", icon: Settings },
];

const MOBILE_MAIN: ViewKey[] = ["dashboard", "tasks", "calendar", "clients"];

function NavButton({
  item,
  active,
  onClick,
  mobile,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  mobile?: boolean;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        mobile ? "w-full" : "w-full",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className={cn("size-4.5", active && "text-primary")} />
      {item.label}
    </button>
  );
}

function DarkToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "الوضع النهاري" : "الوضع الليلي"}
      className="text-muted-foreground"
    >
      {isDark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </Button>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <LayoutDashboard className="size-5" />
      </div>
      <div>
        <p className="text-base font-extrabold leading-tight">منظّمي الشخصي</p>
        <p className="text-[11px] leading-tight text-muted-foreground">كل عملي في مكان واحد</p>
      </div>
    </div>
  );
}

export function AppShell({
  view,
  onNavigate,
  children,
}: {
  view: ViewKey;
  onNavigate: (v: ViewKey) => void;
  children: ReactNode;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const fontScale = useStore((s) => s.settings.fontScale ?? 100);

  /* تطبيق حجم الخط المختار على التطبيق كله */
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
  }, [fontScale]);
  const current = NAV_ITEMS.find((n) => n.key === view) ?? NAV_ITEMS[0];
  const go = (v: ViewKey) => {
    onNavigate(v);
    setSheetOpen(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* الشريط الجانبي — سطح المكتب */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col border-e bg-sidebar lg:flex">
        <div className="border-b p-4">
          <Brand />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => (
            <NavButton key={item.key} item={item} active={view === item.key} onClick={() => go(item.key)} />
          ))}
        </nav>
        <div className="flex items-center justify-between border-t p-3">
          <p className="text-xs text-muted-foreground">يعمل محليًا على جهازك</p>
          <DarkToggle />
        </div>
      </aside>

      <div className="lg:ms-64">
        {/* الترويسة */}
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:px-6">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="القائمة">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0" dir="rtl">
                <SheetHeader className="border-b p-4 text-start">
                  <SheetTitle>
                    <Brand />
                  </SheetTitle>
                </SheetHeader>
                <nav className="space-y-1 p-3">
                  {NAV_ITEMS.map((item) => (
                    <NavButton key={item.key} item={item} active={view === item.key} onClick={() => go(item.key)} mobile />
                  ))}
                </nav>
                <div className="flex items-center justify-between border-t p-4">
                  <p className="text-xs text-muted-foreground">الوضع الليلي</p>
                  <DarkToggle />
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-extrabold">{current.label}</h1>
            <div className="ms-auto flex items-center gap-2.5">
              <span className="hidden text-xs text-muted-foreground sm:block">{fmtTodayFull()}</span>
              <DigitalClock size="sm" />
            </div>
            <span className="ms-auto lg:hidden">
              <DarkToggle />
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 md:px-6 md:pt-6 lg:pb-10">{children}</main>
      </div>

      {/* شريط التنقل السفلي — الجوال */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1.5">
          {NAV_ITEMS.filter((n) => MOBILE_MAIN.includes(n.key)).map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                className={cn(
                  "flex min-w-16 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </button>
            );
          })}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex min-w-16 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground"
          >
            <Menu className="size-5" />
            المزيد
          </button>
        </div>
      </nav>
    </div>
  );
}
