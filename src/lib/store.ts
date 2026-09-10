"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppData,
  AppSettings,
  Client,
  ID,
  Note,
  Project,
  Service,
  ServiceCategory,
  ProjectCategory,
  Task,
  Visit,
} from "./types";
import { addDaysStr, todayStr, uid } from "./utils-app";

/* ================= المصانع ================= */

export function makeProject(data: Partial<Project> = {}): Project {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: "",
    description: "",
    stage: 0,
    notes: "",
    agentName: "",
    agentUrl: "",
    agentModel: "",
    editor: "",
    localPath: "",
    links: [],
    basePrice: 0,
    additions: [],
    createdAt: now,
    updatedAt: now,
    ...data,
  };
}

export function makeClient(data: Partial<Client> = {}): Client {
  return {
    id: uid(),
    name: "",
    category: "",
    location: "",
    phone: "",
    extraPhones: [],
    serviceIds: [],
    status: "جديد",
    notes: "",
    createdAt: new Date().toISOString(),
    ...data,
  };
}

export function makeVisit(data: Partial<Visit> = {}): Visit {
  return {
    id: uid(),
    clientId: "",
    date: todayStr(),
    result: "",
    clientRequest: "",
    projectNotes: "",
    marketingNotes: "",
    generalNotes: "",
    createdAt: new Date().toISOString(),
    ...data,
  };
}

export function makeService(data: Partial<Service> = {}): Service {
  return { id: uid(), name: "", notes: "", ...data };
}

export function makeTask(data: Partial<Task> = {}): Task {
  return {
    id: uid(),
    title: "",
    date: todayStr(),
    priority: "عادية",
    completed: false,
    createdAt: new Date().toISOString(),
    ...data,
  };
}

export function makeNote(data: Partial<Note> = {}): Note {
  const now = new Date().toISOString();
  return { id: uid(), title: "", content: "", createdAt: now, updatedAt: now, ...data };
}

/* ================= البيانات الأولية ================= */

export function defaultSettings(): AppSettings {
  return {
    appName: "منظّمي الشخصي",
    stageNames: ["التصميم والتجهيز", "البناء والتطوير", "الاختبار والتسليم"],
    clockFormat: "12",
    fontScale: 100,
  };
}

export function defaultCategories(): { projectCategories: ProjectCategory[]; serviceCategories: ServiceCategory[] } {
  return {
    projectCategories: [
      { id: uid(), name: "شركة شحن" },
      { id: uid(), name: "مجمع عيادات" },
      { id: uid(), name: "مخبر تحاليل طبية" },
      { id: uid(), name: "صالة بلايستيشن" },
      { id: uid(), name: "معهد تدريس" },
      { id: uid(), name: "روضة خاصة" },
    ],
    serviceCategories: [
      { id: uid(), name: "خدمات رقمية", primary: true },
      { id: uid(), name: "تصميم" },
      { id: uid(), name: "طباعة" },
    ],
  };
}

function seedData(): AppData {
  const t = todayStr();
  const cats = defaultCategories();
  const [digital, design, print] = cats.serviceCategories;

  const services: Service[] = [
    makeService({ name: "تطبيق ويب / لوحة تحكم", categoryId: digital.id, price: 800, notes: "الخدمة الأساسية" }),
    makeService({ name: "موقع تعريفي", categoryId: digital.id, price: 400 }),
    makeService({ name: "تصميم واجهات UI/UX", categoryId: digital.id, price: 150 }),
    makeService({ name: "تصميم شعار", categoryId: design.id, price: 50 }),
    makeService({ name: "هوية بصرية", categoryId: design.id, price: 120 }),
    makeService({ name: "بطاقة أعمال", categoryId: design.id, price: 20 }),
    makeService({ name: "بروشور", categoryId: design.id, price: 30 }),
    makeService({ name: "منشورات سوشال ميديا", categoryId: design.id, price: 15 }),
    makeService({ name: "منيو مطعم", categoryId: design.id, price: 40 }),
    makeService({ name: "بنر إعلاني", categoryId: print.id, price: 25 }),
    makeService({ name: "رول أب", categoryId: print.id, price: 35 }),
    makeService({ name: "لوحات وإشارات", categoryId: print.id, price: 60 }),
  ];

  const project = makeProject({
    name: "لوحة تحكم مجمع عيادات",
    categoryId: cats.projectCategories[1].id,
    description: "نظام لإدارة مجمع عيادات: الحجوزات، المرضى، الأطباء، والتقارير.",
    stage: 1,
    agentName: "Claude Code",
    agentUrl: "https://claude.com/product/claude-code",
    agentModel: "GLM-4.7",
    editor: "VS Code",
    localPath: "D:/Projects/clinics-dashboard",
    links: [
      { id: uid(), label: "GitHub", url: "https://github.com/" },
      { id: uid(), label: "النسخة التجريبية", url: "https://example.com" },
    ],
    basePrice: 850,
    additions: [
      { id: uid(), label: "تطبيق جوال لحجز المواعيد", price: 200 },
      { id: uid(), label: "تقرير إحصائيات شهري", price: 50 },
    ],
  });

  const client = makeClient({
    name: "عيادة الشفاء",
    category: "مجمع عيادات",
    location: "صلاح الدين — عند الدوار",
    phone: "0999999999",
    suitableProjectId: project.id,
    serviceIds: services.filter((s) => [800, 400, 50, 120, 20, 30, 15, 60].includes(s.price ?? 0)).map((s) => s.id),
    status: "تم التواصل",
    followUpDate: addDaysStr(t, 2),
    notes: "أفضل وقت للزيارة بعد الظهر.",
  });

  const tasks: Task[] = [
    makeTask({ title: "تجهيز عرض سعر لعيادة الشفاء", date: t, time: "10:00", priority: "عالية", clientId: client.id }),
    makeTask({ title: "متابعة تطوير لوحة العيادات", date: t, priority: "متوسطة", projectId: project.id }),
    makeTask({ title: "تصميم بطاقة أعمال جديدة", date: addDaysStr(t, 1), priority: "عادية" }),
    makeTask({ title: "مراجعة أسعار الطباعة مع المطبعة", date: addDaysStr(t, -1), priority: "عادية", completed: true }),
  ];

  const visits: Visit[] = [
    makeVisit({
      clientId: client.id,
      date: addDaysStr(t, -5),
      result: "أبدى اهتمامًا مبدئيًا باللوحة وطلب عرضًا تفصيليًا",
      clientRequest: "لوحة تحكم + تطبيق جوال لاحقًا",
      projectNotes: "يحتاج صلاحيات متعددة لكل طبيب، وتقارير شهرية.",
      marketingNotes: "أرسل عرضًا مكتوبًا واذكر أمثلة مشابهة عند الزيارة القادمة.",
      generalNotes: "الموظف المسؤول اسمه أبو أحمد.",
      followUpDate: addDaysStr(t, 2),
    }),
  ];

  const notes: Note[] = [
    makeNote({
      title: "خطة التسويق خلال الإجازة",
      content: "زيارة 3 عملاء أسبوعيًا على الأقل، وتحديث معرض الأعمال، وتجهيز قوالب عروض أسعار جاهزة.",
    }),
  ];

  return {
    projects: [project],
    clients: [client],
    visits,
    services,
    serviceCategories: cats.serviceCategories,
    projectCategories: cats.projectCategories,
    tasks,
    notes,
    settings: defaultSettings(),
  };
}

/* ================= المخزن ================= */

interface AppState extends AppData {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;

  addProject: (p: Project) => void;
  updateProject: (id: ID, patch: Partial<Project>) => void;
  deleteProject: (id: ID) => void;

  addClient: (c: Client) => void;
  updateClient: (id: ID, patch: Partial<Client>) => void;
  deleteClient: (id: ID) => void;

  addVisit: (v: Visit) => void;
  updateVisit: (id: ID, patch: Partial<Visit>) => void;
  deleteVisit: (id: ID) => void;

  addService: (s: Service) => void;
  updateService: (id: ID, patch: Partial<Service>) => void;
  deleteService: (id: ID) => void;

  addProjectCategory: (name: string) => void;
  renameProjectCategory: (id: ID, name: string) => void;
  deleteProjectCategory: (id: ID) => void;

  addServiceCategory: (name: string) => void;
  renameServiceCategory: (id: ID, name: string) => void;
  deleteServiceCategory: (id: ID) => void;

  addTask: (t: Task) => void;
  updateTask: (id: ID, patch: Partial<Task>) => void;
  toggleTask: (id: ID) => void;
  deleteTask: (id: ID) => void;

  addNote: (n: Note) => void;
  updateNote: (id: ID, patch: Partial<Note>) => void;
  deleteNote: (id: ID) => void;

  updateSettings: (patch: Partial<AppSettings>) => void;
  resetAll: () => void;
}

const emptyData = (): AppData => ({
  projects: [],
  clients: [],
  visits: [],
  services: [],
  tasks: [],
  notes: [],
  ...defaultCategories(),
  settings: defaultSettings(),
});

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...seedData(),
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      addProject: (p) => set((s) => ({ projects: [p, ...s.projects] })),
      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
          ),
        })),
      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          tasks: s.tasks.map((t) => (t.projectId === id ? { ...t, projectId: undefined } : t)),
          clients: s.clients.map((c) =>
            c.suitableProjectId === id ? { ...c, suitableProjectId: undefined } : c
          ),
        })),

      addClient: (c) => set((s) => ({ clients: [c, ...s.clients] })),
      updateClient: (id, patch) =>
        set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteClient: (id) =>
        set((s) => ({
          clients: s.clients.filter((c) => c.id !== id),
          visits: s.visits.filter((v) => v.clientId !== id),
          tasks: s.tasks.map((t) => (t.clientId === id ? { ...t, clientId: undefined } : t)),
        })),

      addVisit: (v) => set((s) => ({ visits: [v, ...s.visits] })),
      updateVisit: (id, patch) =>
        set((s) => ({ visits: s.visits.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
      deleteVisit: (id) => set((s) => ({ visits: s.visits.filter((v) => v.id !== id) })),

      addService: (sv) => set((s) => ({ services: [sv, ...s.services] })),
      updateService: (id, patch) =>
        set((s) => ({ services: s.services.map((sv) => (sv.id === id ? { ...sv, ...patch } : sv)) })),
      deleteService: (id) =>
        set((s) => ({
          services: s.services.filter((sv) => sv.id !== id),
          clients: s.clients.map((c) =>
            c.serviceIds.includes(id) ? { ...c, serviceIds: c.serviceIds.filter((x) => x !== id) } : c
          ),
        })),

      addProjectCategory: (name) =>
        set((s) => ({ projectCategories: [...s.projectCategories, { id: uid(), name }] })),
      renameProjectCategory: (id, name) =>
        set((s) => ({
          projectCategories: s.projectCategories.map((c) => (c.id === id ? { ...c, name } : c)),
        })),
      deleteProjectCategory: (id) =>
        set((s) => ({
          projectCategories: s.projectCategories.filter((c) => c.id !== id),
          projects: s.projects.map((p) => (p.categoryId === id ? { ...p, categoryId: undefined } : p)),
        })),

      addServiceCategory: (name) =>
        set((s) => ({ serviceCategories: [...s.serviceCategories, { id: uid(), name }] })),
      renameServiceCategory: (id, name) =>
        set((s) => ({
          serviceCategories: s.serviceCategories.map((c) => (c.id === id ? { ...c, name } : c)),
        })),
      deleteServiceCategory: (id) =>
        set((s) => ({
          serviceCategories: s.serviceCategories.filter((c) => c.id !== id),
          services: s.services.map((sv) => (sv.categoryId === id ? { ...sv, categoryId: undefined } : sv)),
        })),

      addTask: (t) => set((s) => ({ tasks: [t, ...s.tasks] })),
      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
        })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addNote: (n) => set((s) => ({ notes: [n, ...s.notes] })),
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
          ),
        })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      resetAll: () => set({ ...emptyData() }),
    }),
    {
      name: "munazzimi-v1",
      skipHydration: true,
      partialize: (s) => ({
        projects: s.projects,
        clients: s.clients,
        visits: s.visits,
        services: s.services,
        serviceCategories: s.serviceCategories,
        projectCategories: s.projectCategories,
        tasks: s.tasks,
        notes: s.notes,
        settings: s.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

/* ================= أدوات مساعدة ================= */

export function projectTotal(p: Project): number {
  return p.basePrice + p.additions.reduce((a, b) => a + (b.price || 0), 0);
}

export function useProjectsSorted() {
  return useStore((s) => [...s.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}
