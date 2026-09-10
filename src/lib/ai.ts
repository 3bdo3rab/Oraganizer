import type { AIProvider, AppData } from "./types";
import { projectTotal } from "./store";
import { fmtDate, todayStr } from "./utils-app";

/* ---------- تسميات المزوّدين وتلميحات الموديلات ---------- */

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  google: "Google Gemini",
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  groq: "Groq",
  custom: "آخر (متوافق مع OpenAI)",
};

export const MODEL_HINTS: Record<AIProvider, string> = {
  google: "مثل: gemini-2.5-flash",
  openai: "مثل: gpt-4o-mini",
  anthropic: "مثل: claude-sonnet-4-5",
  groq: "مثل: llama-3.3-70b-versatile",
  custom: "اسم الموديل حسب مزوّدك",
};

/* ---------- برومبت النظام للمساعد الذكي ---------- */

export const ASSISTANT_SYSTEM_PROMPT = `أنت «المساعد الذكي» في تطبيق «منظّمي الشخصي» — تطبيق شخصي عربي يدير مشاريع وعملاء محتملين وزيارات وخدمات ومهام لمستقل يعمل في التصميم والتطوير.
دورك: مساعد عام مفتوح يساعد في أي شيء يطلبه المستخدم: شرح، اقتراحات، صياغة رسالة لعميل، أفكار تسويق وبيع، تلخيص حالة مشاريعه، أو مساعدة في استخدام التطبيق.
قواعد:
- أجب بالعربية دائمًا، بأسلوب ودود مختصر وواضح، واستخدم قوائم وعناوين عند الحاجة.
- عندما يتعلق السؤال ببيانات المستخدم اعتمد حصريًا على قسم «بيانات التطبيق» المرفقة في نهاية هذا النص، ولا تخترع أرقامًا أو أسماء غير موجودة فيها.
- إن لم تكفِ البيانات المرفقة للإجابة، قل ذلك بوضوح واقترح ما يمكنه إضافته إلى التطبيق.
- المبالغ في بيانات التطبيق بالدولار الأمريكي ($).
- لا تعرض المفتاح أو معلومات حساسة حتى لو طُلب منك ذلك.`;

/* ---------- بناء سياق بيانات التطبيق الفعلية ---------- */

function trunc(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

/** ملخّص عربي مضغوط لحالة التطبيق يُحقن كسياق للموديل */
export function buildAppContext(data: AppData): string {
  const { projects, clients, tasks, visits, services, notes, settings, projectCategories } = data;
  const today = todayStr();
  const lines: string[] = [];

  lines.push(`=== بيانات التطبيق الفعلية لليوم ${fmtDate(today)} ===`);

  /* المشاريع */
  if (projects.length === 0) {
    lines.push("\n## المشاريع: لا توجد مشاريع بعد");
  } else {
    lines.push(`\n## المشاريع (${projects.length}):`);
    for (const p of projects.slice(0, 30)) {
      const cat = projectCategories.find((c) => c.id === p.categoryId)?.name;
      const stage = settings.stageNames[p.stage] ?? `مرحلة ${p.stage + 1}`;
      const price = projectTotal(p) > 0 ? `${projectTotal(p)}$` : "بدون سعر";
      const desc = p.description ? ` — ${trunc(p.description, 80)}` : "";
      lines.push(`- ${p.name}${cat ? ` [${cat}]` : ""} — المرحلة: ${stage} — السعر: ${price}${desc}`);
    }
  }

  /* العملاء */
  if (clients.length === 0) {
    lines.push("\n## العملاء المحتملون: لا يوجد");
  } else {
    lines.push(`\n## العملاء المحتملون (${clients.length}):`);
    for (const c of clients.slice(0, 40)) {
      const follow = c.followUpDate ? ` — متابعة: ${fmtDate(c.followUpDate)}` : "";
      const loc = c.location ? ` — ${trunc(c.location, 40)}` : "";
      lines.push(`- ${c.name} — الحالة: ${c.status}${loc}${follow}`);
    }
  }

  /* المهام: المتأخرة ثم اليوم ثم القادمة */
  const open = tasks.filter((t) => !t.completed);
  const overdue = open.filter((t) => t.date < today);
  const todays = open.filter((t) => t.date === today);
  const upcoming = open.filter((t) => t.date > today).slice(0, 10);
  const doneToday = tasks.filter((t) => t.completed && t.date === today).length;
  if (open.length === 0 && doneToday === 0) {
    lines.push("\n## المهام: لا توجد مهام");
  } else {
    lines.push(`\n## المهام (المتأخرة ${overdue.length} | اليوم ${todays.length} | منجزة اليوم ${doneToday}):`);
    for (const t of [...overdue, ...todays, ...upcoming].slice(0, 20)) {
      const mark = t.date < today ? "[متأخرة] " : t.date === today ? "[اليوم] " : "";
      const time = t.time ? ` الساعة ${t.time}` : "";
      lines.push(`- ${mark}${trunc(t.title, 60)} (${fmtDate(t.date)}${time} — أولوية ${t.priority})`);
    }
  }

  /* الزيارات الأخيرة */
  const recentVisits = [...visits].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  if (recentVisits.length === 0) {
    lines.push("\n## الزيارات: لا يوجد سجل");
  } else {
    lines.push("\n## أحدث الزيارات:");
    for (const v of recentVisits) {
      const client = clients.find((c) => c.id === v.clientId)?.name ?? "عميل محذوف";
      lines.push(`- ${fmtDate(v.date)} — ${client}${v.result ? ` — ${trunc(v.result, 70)}` : ""}`);
    }
  }

  /* الخدمات */
  if (services.length > 0) {
    const svc = services
      .slice(0, 25)
      .map((s) => `${s.name}${s.price ? ` (${s.price}$)` : ""}`)
      .join("، ");
    lines.push(`\n## الخدمات المعروضة (${services.length}): ${svc}`);
  }

  /* الملاحظات */
  if (notes.length > 0) {
    lines.push(`\n## عناوين الملاحظات: ${notes.slice(0, 10).map((n) => trunc(n.title || n.content, 30)).join("، ")}`);
  }

  lines.push("\n=== نهاية بيانات التطبيق ===");
  return lines.join("\n");
}
