import { NextRequest, NextResponse } from "next/server";
import { normalizeModelName } from "@/lib/ai";

/**
 * مسار محلي يوحّد الاتصال بمزوّدي الذكاء الاصطناعي بمفتاح المستخدم.
 * الاستخدام الوحيد لخدمة خارجية في التطبيق — المفتاح لا يُرسل إلا للمزوّد المختار.
 */

type Provider = "google" | "openai" | "anthropic" | "groq" | "custom";

interface WireMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  provider?: Provider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  system?: string;
  messages?: WireMessage[];
}

const TIMEOUT_MS = 90_000;

/** استخراج رسالة خطأ واضحة من جسم رد المزوّد */
async function readProviderError(res: Response): Promise<string> {
  let detail = "";
  try {
    const data = (await res.json()) as { error?: { message?: string } | string };
    const err = data?.error;
    detail = typeof err === "string" ? err : err?.message ?? "";
  } catch {
    /* جسم غير JSON */
  }
  if (res.status === 401 || res.status === 403) {
    return `المفتاح غير صالح أو غير مصرّح (${res.status})${detail ? `: ${detail}` : ""}`;
  }
  if (res.status === 429) {
    return `تجاوزت حد الاستخدام أو الطلبات (${res.status})${detail ? `: ${detail}` : ""}`;
  }
  if (res.status === 404) {
    return `اسم الموديل غير موجود لدى المزوّد (${res.status})${detail ? `: ${detail}` : ""}`;
  }
  // خطأ تنسيق اسم الموديل من جوجل — نرجّم الاسم الصحيح بدل الرسالة التقنية
  if (res.status === 400 && /model.{0,40}(format|name)|unexpected model/i.test(detail)) {
    return `تنسيق اسم الموديل غير صحيح — يجب أن يكون بأحرف صغيرة وشرطات مثل: gemini-2.5-flash (بدون مسافات). جرّب زر «جلب الموديلات» لاختيار اسم صحيح.${detail ? `\nالتفصيل: ${detail}` : ""}`;
  }
  return `خطأ من المزوّد (${res.status})${detail ? `: ${detail}` : ""}`;
}

/** توحيد عنوان الخدمة المخصّص إلى نهاية /chat/completions */
function normalizeBaseUrl(raw: string): string {
  const base = raw.trim().replace(/\/+$/, "");
  if (!base) return "";
  if (/\/chat\/completions$/.test(base)) return base;
  if (/\/v\d+$/.test(base)) return `${base}/chat/completions`;
  return `${base}/v1/chat/completions`;
}

async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  system: string,
  messages: WireMessage[]
): Promise<string> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: system ? [{ role: "system", content: system }, ...messages] : messages,
    }),
  });
  if (!res.ok) throw new Error(await readProviderError(res));
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("وصل رد فارغ من المزوّد");
  return text;
}

async function callProvider(body: ChatRequestBody & { provider: Provider; model: string; apiKey: string; messages: WireMessage[] }): Promise<string> {
  const { provider, model, apiKey, baseUrl, system = "", messages } = body;

  if (provider === "google") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        body: JSON.stringify({
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          contents: messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );
    if (!res.ok) throw new Error(await readProviderError(res));
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      promptFeedback?: { blockReason?: string };
    };
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .filter(Boolean)
        .join("\n") ?? "";
    if (!text) {
      const reason = data?.promptFeedback?.blockReason;
      throw new Error(reason ? `تم حجب الطلب من المزوّد: ${reason}` : "وصل رد فارغ من المزوّد");
    }
    return text;
  }

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        ...(system ? { system } : {}),
        messages,
      }),
    });
    if (!res.ok) throw new Error(await readProviderError(res));
    const data = (await res.json()) as { content?: { type?: string; text?: string }[] };
    const text =
      data?.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .filter(Boolean)
        .join("\n") ?? "";
    if (!text) throw new Error("وصل رد فارغ من المزوّد");
    return text;
  }

  if (provider === "groq") {
    return callOpenAICompatible("https://api.groq.com/openai/v1/chat/completions", apiKey, model, system, messages);
  }

  if (provider === "custom") {
    const endpoint = normalizeBaseUrl(baseUrl ?? "");
    if (!endpoint) throw new Error("أدخل عنوان الخدمة (Base URL) لمزوّد «آخر» في الإعدادات");
    return callOpenAICompatible(endpoint, apiKey, model, system, messages);
  }

  /* openai */
  return callOpenAICompatible("https://api.openai.com/v1/chat/completions", apiKey, model, system, messages);
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "طلب غير صالح" }, { status: 400 });
  }

  const { provider = "google", model, apiKey, baseUrl, system = "", messages } = body;

  if (!apiKey?.trim()) {
    return NextResponse.json({ ok: false, error: "لا يوجد مفتاح API محفوظ" }, { status: 400 });
  }
  if (!model?.trim()) {
    return NextResponse.json({ ok: false, error: "اسم الموديل مفقود" }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ ok: false, error: "لا توجد رسائل في الطلب" }, { status: 400 });
  }

  try {
    // تطبيع اسم الموديل يعالج المسافات/الأحرف الكبيرة/المحارف الخفية/بادئة models/
    const cleanModel = normalizeModelName(provider, model);
    if (!cleanModel) {
      return NextResponse.json({ ok: false, error: "اسم الموديل غير صالح" }, { status: 400 });
    }
    const text = await callProvider({ provider, model: cleanModel, apiKey: apiKey.trim(), baseUrl, system, messages });
    return NextResponse.json({ ok: true, text });
  } catch (e) {
    const msg =
      e instanceof Error && e.name === "TimeoutError"
        ? "انتهت مهلة الاتصال بالمزوّد — حاول مجددًا"
        : e instanceof TypeError
          ? "تعذّر الوصول إلى الإنترنت أو خدمة المزوّد"
          : e instanceof Error
            ? e.message
            : "خطأ غير معروف";
    return NextResponse.json({ ok: false, error: msg });
  }
}
