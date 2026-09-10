"use client";

import {
  Bot,
  KeyRound,
  LoaderCircle,
  MessageSquarePlus,
  SendHorizonal,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ASSISTANT_SYSTEM_PROMPT, PROVIDER_LABELS, buildAppContext } from "@/lib/ai";
import { useStore } from "@/lib/store";
import type { ChatMessage } from "@/lib/types";
import { fmtTimeIn } from "@/lib/utils-app";
import { cn } from "@/lib/utils";
import { useClockFormat } from "./clock";

/** توقيت رسالة بحسب نمط الساعة المختار */
function msgTime(at: string, clockFormat: "12" | "24"): string {
  const d = new Date(at);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return fmtTimeIn(`${hh}:${mm}`, clockFormat);
}

function Bubble({ m }: { m: ChatMessage }) {
  const clockFormat = useClockFormat();
  const isUser = m.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          m.isError
            ? "border border-destructive/30 bg-destructive/10 text-destructive"
            : isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
        )}
      >
        {m.isError ? (
          <span className="mb-1 flex items-center gap-1.5 text-xs font-bold">
            <TriangleAlert className="size-3.5" /> خطأ في الاتصال
          </span>
        ) : null}
        {m.content}
        <span className={cn("mt-1 block text-[10px]", isUser && !m.isError ? "opacity-75" : "text-muted-foreground")}>
          {msgTime(m.at, clockFormat)}
        </span>
      </div>
    </div>
  );
}

/** علامة «يكتب…» أثناء انتظار الرد */
function TypingIndicator() {
  return (
    <div className="flex justify-end">
      <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
        <span className="flex items-center gap-1">
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.3s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
        </span>
        <span className="text-xs text-muted-foreground">يكتب…</span>
      </div>
    </div>
  );
}

/**
 * المساعد الذكي: زر عائم في كل الشاشات + نافذة محادثة عربية RTL
 * تُحفظ محليًا مع باقي البيانات، وتُرسل للمزوّد عبر المسار المحلي /api/ai/chat.
 */
export function AssistantDock({ onNavigateSettings }: { onNavigateSettings: () => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ai = useStore((s) => s.settings.ai);
  const chat = useStore((s) => s.chat);
  const addChatMessage = useStore((s) => s.addChatMessage);
  const clearChat = useStore((s) => s.clearChat);

  const provider = ai?.provider ?? "google";
  const hasKey = Boolean(ai?.apiKey?.trim() && ai?.model?.trim());

  /* تمرير تلقائي لآخر رسالة */
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [chat.length, pending, open]);

  const send = async () => {
    const content = input.trim();
    if (!content || pending) return;
    if (!hasKey || !ai) {
      toast.error("أضف مفتاح الذكاء الاصطناعي من الإعدادات أولًا");
      return;
    }

    setInput("");
    addChatMessage({ role: "user", content });
    setPending(true);
    try {
      const state = useStore.getState();
      const history = state.chat
        .slice(-20)
        .filter((m) => !m.isError)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: ai.provider,
          model: ai.model.trim(),
          apiKey: ai.apiKey.trim(),
          baseUrl: ai.baseUrl,
          system: `${ASSISTANT_SYSTEM_PROMPT}\n\n${buildAppContext(state)}`,
          messages: history,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; text?: string; error?: string };
      if (data?.ok && data.text) {
        addChatMessage({ role: "assistant", content: data.text });
      } else {
        throw new Error(data?.error ?? `فشل الطلب (رمز ${res.status})`);
      }
    } catch (e) {
      const msg =
        e instanceof TypeError
          ? "تعذّر الاتصال بخدمة التطبيق المحلية — تأكد أن التطبيق يعمل ثم أعد المحاولة."
          : e instanceof Error
            ? e.message
            : "خطأ غير معروف";
      addChatMessage({ role: "assistant", content: msg, isError: true });
    } finally {
      setPending(false);
    }
  };

  const newConversation = () => {
    if (pending) return;
    clearChat();
    toast.success("بدأت محادثة جديدة");
  };

  return (
    <>
      {/* الزر العائم — يظهر فوق شريط التنقل على الجوال */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="المساعد الذكي"
        className="fixed bottom-20 end-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 lg:bottom-6 lg:end-6"
      >
        <Sparkles className="size-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" dir="rtl" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="space-y-1 border-b p-4">
            <div className="flex items-center gap-2">
              <SheetTitle className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Bot className="size-4.5" />
                </span>
                المساعد الذكي
              </SheetTitle>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ms-auto size-8 text-muted-foreground"
                    disabled={pending}
                    aria-label="محادثة جديدة"
                  >
                    <MessageSquarePlus className="size-4.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader className="text-right">
                    <AlertDialogTitle>بدء محادثة جديدة؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم مسح سجل المحادثة الحالي بالكامل من هذا الجهاز — لا يمكن التراجع.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row-reverse gap-2">
                    <AlertDialogAction onClick={newConversation}>نعم، محادثة جديدة</AlertDialogAction>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <SheetDescription className="text-xs">
              {hasKey
                ? `يجيب بناءً على بياناتك الفعلية — ${PROVIDER_LABELS[provider]} • ${ai?.model}`
                : "مساعد عام لكل احتياجاتك: شرح، صياغة رسائل، أفكار تسويق، وتلخيص حالة عملك"}
            </SheetDescription>
          </SheetHeader>

          {/* الرسائل */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {!hasKey ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/50">
                <p className="mb-2 flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <KeyRound className="size-4" />
                  لا يوجد مفتاح ذكاء اصطناعي محفوظ
                </p>
                <p className="mb-3 leading-relaxed text-amber-800/90 dark:text-amber-200/90">
                  لتشغيل المساعد أضف مفتاحك (واسم الموديل) من صفحة الإعدادات — يبقى محفوظًا على جهازك فقط.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    onNavigateSettings();
                  }}
                >
                  فتح الإعدادات
                </Button>
              </div>
            ) : null}

            {chat.map((m) => (
              <Bubble key={m.id} m={m} />
            ))}

            {pending ? <TypingIndicator /> : null}
          </div>

          {/* صندوق الإدخال */}
          <form
            className="flex items-end gap-2 border-t p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <Textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              disabled={!hasKey || pending}
              placeholder={hasKey ? "اكتب سؤالك للمساعد… (Enter للإرسال)" : "أضف المفتاح من الإعدادات أولًا…"}
              className="max-h-32 min-h-10 flex-1 resize-none"
              aria-label="رسالة للمساعد"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!hasKey || pending || !input.trim()}
              aria-label="إرسال"
              className="size-10 shrink-0"
            >
              {pending ? <LoaderCircle className="size-4.5 animate-spin" /> : <SendHorizonal className="size-4.5" />}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
