"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import type { ClockFormat } from "@/lib/types";
import { clockParts } from "@/lib/utils-app";
import { cn } from "@/lib/utils";

/** الوقت الحالي يُحدَّث كل ثانية — التهيئة الكسولة آمنة لأن الواجهة تُعرض على العميل بعد الترطيب */
export function useNow(stepMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), stepMs);
    return () => clearInterval(id);
  }, [stepMs]);
  return now;
}

/** نمط الساعة الحالي من الإعدادات (مع احتياط للبيانات القديمة المحفوظة) */
export function useClockFormat(): ClockFormat {
  return useStore((s) => s.settings.clockFormat ?? "12");
}

/**
 * ساعة رقمية حيّة وفق نمط الساعة من الإعدادات.
 * — size "hero": كبيرة للرئيسية (تحت التاريخ)
 * — size "sm": مدمجة للترويسة وبطاقات المعاينة
 */
export function DigitalClock({
  size = "hero",
  className,
}: {
  size?: "sm" | "hero";
  className?: string;
}) {
  const format = useClockFormat();
  const now = useNow();
  const parts = clockParts(now, format);

  if (size === "sm") {
    return (
      <span
        dir="ltr"
        className={cn("inline-flex items-baseline gap-1 font-mono tabular-nums leading-none", className)}
      >
        <span className="text-sm font-bold">{parts.main}</span>
        {parts.period ? (
          <span dir="rtl" className="font-sans text-[10px] font-semibold text-muted-foreground">
            {parts.period}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <div
      dir="ltr"
      aria-label="الساعة"
      className={cn("flex items-baseline gap-2 font-mono tabular-nums", className)}
    >
      <span className="text-5xl font-extrabold leading-none tracking-tight text-foreground sm:text-6xl">
        {parts.main}
      </span>
      <span className="text-lg font-bold leading-none text-muted-foreground sm:text-xl">
        :{parts.seconds}
      </span>
      {parts.period ? (
        <span dir="rtl" className="font-sans text-xl font-extrabold leading-none text-primary sm:text-2xl">
          {parts.period}
        </span>
      ) : null}
    </div>
  );
}
