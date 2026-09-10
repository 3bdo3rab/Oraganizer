import { NextRequest, NextResponse } from "next/server";

/**
 * جلب قائمة الموديلات المتاحة لدى المزوّد بمفتاح المستخدم،
 * ليختار الاسم الصحيح من قائمة حقيقية بدل التخمين.
 */

type Provider = "google" | "openai" | "anthropic" | "groq" | "custom";

interface ModelsRequestBody {
  provider?: Provider;
  apiKey?: string;
  baseUrl?: string;
}

const TIMEOUT_MS = 30_000;

function friendlyError(res: Response, detail: string): string {
  if (res.status === 401 || res.status === 403) {
    return `المفتاح غير صالح أو غير مصرّح (${res.status})${detail ? `: ${detail}` : ""}`;
  }
  if (res.status === 429) {
    return `تجاوزت حد الاستخدام أو الطلبات (${res.status})${detail ? `: ${detail}` : ""}`;
  }
  // حظر جغرافي — دولة المستخدم غير مدعومة لدى المزوّد
  if (/location is not supported|not supported for the api use|country.*not supported/i.test(detail)) {
    return "موقعك الجغرافي غير مدعوم لدى هذا المزوّد (حظر حسب الدولة وليس خطأ في مفتاحك). الحل الأسرع: اختر مزوّد «آخر (متوافق مع OpenAI)» واستخدم خدمة وسيطة مثل OpenRouter — تعبّئها بزر واحد من الإعدادات — أو فعِّل VPN من بلد مدعوم ثم أعد المحاولة.";
  }
  return `خطأ من المزوّد (${res.status})${detail ? `: ${detail}` : ""}`;
}

/** توحيد عنوان الخدمة المخصّص إلى نهاية /models */
function customModelsUrl(raw: string): string {
  const base = raw.trim().replace(/\/+$/, "");
  if (!base) return "";
  if (/\/models$/.test(base)) return base;
  if (/\/chat\/completions$/.test(base)) return base.replace(/\/chat\/completions$/, "/models");
  if (/\/v\d+$/.test(base)) return `${base}/models`;
  return `${base}/v1/models`;
}

async function readDetail(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: { message?: string } | string };
    const err = data?.error;
    return typeof err === "string" ? err : err?.message ?? "";
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  let body: ModelsRequestBody;
  try {
    body = (await req.json()) as ModelsRequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "طلب غير صالح" }, { status: 400 });
  }

  const { provider = "google", apiKey, baseUrl } = body;
  if (!apiKey?.trim()) {
    return NextResponse.json({ ok: false, error: "أدخل المفتاح أولًا" }, { status: 400 });
  }
  const key = apiKey.trim();

  try {
    let models: string[] = [];

    if (provider === "google") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${encodeURIComponent(key)}`,
        { signal: AbortSignal.timeout(TIMEOUT_MS) }
      );
      if (!res.ok) return NextResponse.json({ ok: false, error: friendlyError(res, await readDetail(res)) });
      const data = (await res.json()) as {
        models?: { name?: string; supportedGenerationMethods?: string[] }[];
      };
      models = (data.models ?? [])
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => (m.name ?? "").replace(/^models\//, ""))
        .filter(Boolean);
    } else if (provider === "openai" || provider === "groq") {
      const url =
        provider === "openai"
          ? "https://api.openai.com/v1/models"
          : "https://api.groq.com/openai/v1/models";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) return NextResponse.json({ ok: false, error: friendlyError(res, await readDetail(res)) });
      const data = (await res.json()) as { data?: { id?: string }[] };
      models = (data.data ?? []).map((m) => m.id ?? "").filter(Boolean);
    } else if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/models?limit=100", {
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) return NextResponse.json({ ok: false, error: friendlyError(res, await readDetail(res)) });
      const data = (await res.json()) as { data?: { id?: string }[] };
      models = (data.data ?? []).map((m) => m.id ?? "").filter(Boolean);
    } else {
      /* custom */
      const url = customModelsUrl(baseUrl ?? "");
      if (!url) {
        return NextResponse.json(
          { ok: false, error: "أدخل عنوان الخدمة (Base URL) لمزوّد «آخر» أولًا" },
          { status: 400 }
        );
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) return NextResponse.json({ ok: false, error: friendlyError(res, await readDetail(res)) });
      const data = (await res.json()) as { data?: { id?: string }[] };
      models = (data.data ?? []).map((m) => m.id ?? "").filter(Boolean);
    }

    models = [...new Set(models)].sort((a, b) => a.localeCompare(b));
    if (models.length === 0) {
      return NextResponse.json({ ok: false, error: "لم يُرجع المزوّد أي موديلات لهذا المفتاح" });
    }
    return NextResponse.json({ ok: true, models });
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
