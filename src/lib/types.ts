export type ID = string;

export interface ProjectCategory {
  id: ID;
  name: string;
}

export interface ServiceCategory {
  id: ID;
  name: string;
  /** الخدمات الرقمية هي الأساس */
  primary?: boolean;
}

export interface ProjectLink {
  id: ID;
  label: string;
  url: string;
}

export interface PriceAddition {
  id: ID;
  label: string;
  price: number;
}

/** المراحل الثلاث فقط: 0 التصميم والتجهيز، 1 البناء والتطوير، 2 الاختبار والتسليم */
export type StageIndex = 0 | 1 | 2;

export interface Project {
  id: ID;
  name: string;
  categoryId?: ID;
  description: string;
  stage: StageIndex;
  notes: string;
  /** معلومات تطوير المشروع */
  agentName: string;
  agentUrl: string;
  agentModel: string;
  editor: string;
  localPath: string;
  links: ProjectLink[];
  basePrice: number;
  additions: PriceAddition[];
  createdAt: string;
  updatedAt: string;
}

export const CLIENT_STATUSES = [
  "جديد",
  "تم التواصل",
  "مهتم",
  "بانتظار الرد",
  "مرفوض",
  "صار عميلاً",
] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export interface Client {
  id: ID;
  name: string;
  category: string;
  location: string;
  phone: string;
  extraPhones: string[];
  /** المشروع المناسب له هذا العميل */
  suitableProjectId?: ID;
  /** الخدمات القابلة للعرض عليه */
  serviceIds: ID[];
  status: ClientStatus;
  /** موعد المتابعة yyyy-MM-dd */
  followUpDate?: string;
  notes: string;
  createdAt: string;
}

export interface Visit {
  id: ID;
  clientId: ID;
  date: string;
  /** نتيجة الزيارة */
  result: string;
  /** ماذا طلب العميل؟ */
  clientRequest: string;
  /** ملاحظات على المشروع */
  projectNotes: string;
  /** ملاحظات لتحسين البيع والتسويق */
  marketingNotes: string;
  generalNotes: string;
  /** موعد المتابعة الناتج عن الزيارة */
  followUpDate?: string;
  createdAt: string;
}

export interface Service {
  id: ID;
  name: string;
  categoryId?: ID;
  price?: number;
  notes: string;
}

export const TASK_PRIORITIES = ["عادية", "متوسطة", "عالية"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: ID;
  title: string;
  date: string;
  time?: string;
  priority: TaskPriority;
  projectId?: ID;
  clientId?: ID;
  completed: boolean;
  createdAt: string;
}

export interface Note {
  id: ID;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/** نمط عرض الساعة */
export type ClockFormat = "12" | "24";

/** مزوّدو الذكاء الاصطناعي المدعومون */
export type AIProvider = "google" | "openai" | "anthropic" | "groq" | "custom";

/** إعدادات مفتاح الذكاء الاصطناعي — تُحفظ محليًا فقط */
export interface AISettings {
  provider: AIProvider;
  /** اسم الموديل نص حر مثل gemini-2.5-flash */
  model: string;
  apiKey: string;
  /** عنوان خدمة مخصّص لمزوّد «آخر» المتوافق مع OpenAI */
  baseUrl?: string;
  notes?: string;
}

/** رسالة في محادثة المساعد الذكي */
export interface ChatMessage {
  id: ID;
  role: "user" | "assistant";
  content: string;
  /** رسالة خطأ اتصال تُعرض بستايل مميز */
  isError?: boolean;
  /** توقيت ISO */
  at: string;
}

export interface AppSettings {
  appName: string;
  stageNames: [string, string, string];
  /** نمط الساعة: 12 أو 24 — اختياري لتوافق البيانات المحفوظة سابقًا */
  clockFormat?: ClockFormat;
  /** حجم الخط كنسبة مئوية: 90 / 100 / 110 / 125 */
  fontScale?: number;
  /** مفتاح الذكاء الاصطناعي — الاستخدام الوحيد لخدمة خارجية */
  ai?: AISettings;
}

export interface AppData {
  projects: Project[];
  clients: Client[];
  visits: Visit[];
  services: Service[];
  serviceCategories: ServiceCategory[];
  projectCategories: ProjectCategory[];
  tasks: Task[];
  notes: Note[];
  settings: AppSettings;
  /** محادثة المساعد الذكي — تُحفظ محليًا */
  chat: ChatMessage[];
}
