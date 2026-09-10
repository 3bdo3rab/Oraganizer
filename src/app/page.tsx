"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import { useStore } from "@/lib/store";
import { AppShell, type ViewKey } from "@/components/app/app-shell";
import { Dashboard } from "@/components/app/dashboard";
import { TasksView } from "@/components/app/tasks-view";
import { CalendarView } from "@/components/app/calendar-view";
import { ProjectsView } from "@/components/app/projects-view";
import { ClientsView } from "@/components/app/clients-view";
import { VisitsView } from "@/components/app/visits-view";
import { ServicesView } from "@/components/app/services-view";
import { NotesView } from "@/components/app/notes-view";
import { SettingsView } from "@/components/app/settings-view";
import { Skeleton } from "@/components/ui/skeleton";

function Splash() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6" dir="rtl">
      <Skeleton className="h-10 w-56" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function Page() {
  const hydrated = useStore((s) => s.hydrated);
  const [view, setView] = useState<ViewKey>("dashboard");
  const [clientFocus, setClientFocus] = useState<string | null>(null);
  const [projectFocus, setProjectFocus] = useState<string | null>(null);

  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);

  const navigate = (v: ViewKey, opts?: { clientId?: string; projectId?: string }) => {
    if (v !== view) {
      setClientFocus(null);
      setProjectFocus(null);
    }
    setView(v);
    if (opts?.clientId !== undefined) setClientFocus(opts.clientId);
    if (opts?.projectId !== undefined) setProjectFocus(opts.projectId);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  if (!hydrated) return <Splash />;

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <AppShell view={view} onNavigate={(v) => navigate(v)}>
        {view === "dashboard" ? <Dashboard navigate={navigate} /> : null}
        {view === "tasks" ? <TasksView /> : null}
        {view === "calendar" ? <CalendarView /> : null}
        {view === "projects" ? (
          <ProjectsView focusId={projectFocus} onFocusChange={setProjectFocus} navigate={navigate} />
        ) : null}
        {view === "clients" ? (
          <ClientsView focusId={clientFocus} onFocusChange={setClientFocus} navigate={navigate} />
        ) : null}
        {view === "visits" ? <VisitsView navigate={navigate} /> : null}
        {view === "services" ? <ServicesView /> : null}
        {view === "notes" ? <NotesView /> : null}
        {view === "settings" ? <SettingsView navigate={navigate} /> : null}
      </AppShell>
    </ThemeProvider>
  );
}
