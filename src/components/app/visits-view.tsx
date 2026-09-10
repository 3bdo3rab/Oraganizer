"use client";

import { CalendarClock, Footprints, Pencil, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { fmtDate, relDay } from "@/lib/utils-app";
import type { Visit } from "@/lib/types";
import { ConfirmDelete, EmptyState, InfoRow } from "./shared";
import { VisitFormDialog } from "./visit-form";
import type { NavFn } from "./nav-types";

export function VisitsView({ navigate }: { navigate: NavFn }) {
  const visits = useStore((s) => s.visits);
  const clients = useStore((s) => s.clients);
  const deleteVisit = useStore((s) => s.deleteVisit);
  const [clientFilter, setClientFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; visit?: Visit }>({ open: false });

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "عميل محذوف";

  const filtered = useMemo(() => {
    return [...visits]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .filter((v) => (clientFilter === "all" ? true : v.clientId === clientFilter))
      .filter((v) =>
        search.trim()
          ? [v.result, v.clientRequest, v.projectNotes, v.marketingNotes, v.generalNotes].some((x) =>
              x.includes(search.trim())
            )
          : true
      );
  }, [visits, clientFilter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="العميل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل العملاء</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative w-full sm:w-64">
          <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في نتائج الزيارات والملاحظات…"
            className="ps-8"
          />
        </div>
        <Button
          className="ms-auto shrink-0"
          onClick={() => setDialog({ open: true })}
          disabled={clients.length === 0}
        >
          <Plus className="size-4" /> زيارة جديدة
        </Button>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Footprints}
          title="أضف عميلًا أولًا"
          hint="الزيارات مرتبطة بالعملاء — أضف عميلًا محتملًا ثم سجّل زياراتك عليه"
          action={<Button onClick={() => navigate("clients")}>الذهاب إلى العملاء</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Footprints}
          title={visits.length === 0 ? "لا زيارات مسجلة بعد" : "لا نتائج مطابقة"}
          hint={
            visits.length === 0
              ? "كل زيارة تُسجَّل بنتيجتها وملاحظاتها لتصبح لديك قصة كاملة مع كل عميل"
              : "جرّب تغيير البحث أو التصفية"
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => (
            <Card key={v.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="text-base font-bold hover:text-primary"
                    onClick={() => navigate("clients", { clientId: v.clientId })}
                  >
                    {clientName(v.clientId)}
                  </button>
                  <Badge className="gap-1 border-0 bg-primary/10 text-primary">
                    <CalendarClock className="size-3" />
                    {fmtDate(v.date)} — {relDay(v.date)}
                  </Badge>
                  {v.followUpDate ? (
                    <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300 dark:border-amber-800">
                      متابعة: {fmtDate(v.followUpDate)} ({relDay(v.followUpDate)})
                    </Badge>
                  ) : null}
                  <div className="ms-auto flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground"
                      onClick={() => setDialog({ open: true, visit: v })}
                      aria-label="تعديل"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <ConfirmDelete itemLabel="الزيارة" onConfirm={() => deleteVisit(v.id)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <InfoRow label="النتيجة" value={v.result} />
                  <InfoRow label="طلب العميل" value={v.clientRequest} />
                  <InfoRow label="على المشروع" value={v.projectNotes} />
                  <InfoRow label="لتحسين البيع" value={v.marketingNotes} />
                  <InfoRow label="ملاحظات عامة" value={v.generalNotes} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <VisitFormDialog open={dialog.open} onOpenChange={(v) => setDialog({ open: v })} visit={dialog.visit} />
    </div>
  );
}
