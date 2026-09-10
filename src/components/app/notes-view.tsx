"use client";

import { Pencil, Plus, Search, StickyNote } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { makeNote, useStore } from "@/lib/store";
import { fmtDate } from "@/lib/utils-app";
import type { Note } from "@/lib/types";
import { ConfirmDelete, EmptyState, Field } from "./shared";

function NoteFormInner({ note, close }: { note?: Note; close: () => void }) {
  const addNote = useStore((s) => s.addNote);
  const updateNote = useStore((s) => s.updateNote);
  const [form, setForm] = useState<Note>(() => (note ? { ...note } : makeNote()));
  const [err, setErr] = useState("");

  const save = () => {
    if (!form.content.trim() && !form.title.trim()) return setErr("اكتب شيئًا في الملاحظة");
    if (note) {
      updateNote(note.id, form);
      toast.success("تم حفظ الملاحظة");
    } else {
      addNote(form);
      toast.success("تمت إضافة الملاحظة");
    }
    close();
  };

  return (
    <>
      <div className="space-y-4">
        <Field label="العنوان (اختياري)">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عنوان قصير" autoFocus />
        </Field>
        <Field label="المحتوى *">
          <Textarea
            rows={6}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="اكتب ملاحظتك هنا…"
          />
        </Field>
        {err ? <p className="text-sm text-destructive">{err}</p> : null}
      </div>
      <div className="mt-4 flex flex-row-reverse gap-2">
        <Button onClick={save}>{note ? "حفظ التعديل" : "إضافة الملاحظة"}</Button>
        <Button variant="outline" onClick={close}>
          إلغاء
        </Button>
      </div>
    </>
  );
}

export function NotesView() {
  const notes = useStore((s) => s.notes);
  const deleteNote = useStore((s) => s.deleteNote);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; note?: Note }>({ open: false });

  const q = search.trim();
  const filtered = notes
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter((n) => (q ? n.title.includes(q) || n.content.includes(q) : true));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في الملاحظات…" className="ps-8" />
        </div>
        <Button
          className="ms-auto shrink-0"
          onClick={() => setDialog({ open: true })}
        >
          <Plus className="size-4" /> ملاحظة جديدة
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title={notes.length === 0 ? "لا ملاحظات بعد" : "لا نتائج مطابقة"}
          hint={
            notes.length === 0
              ? "مكان لأفكارك العامة التي لا ترتبط بعميل أو مشروع بعينه"
              : "جرّب كلمة بحث أخرى"
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((n) => (
            <Card key={n.id} className="group relative">
              <CardContent className="p-4">
                {n.title ? <p className="mb-1 font-bold">{n.title}</p> : null}
                <p className="whitespace-pre-wrap text-sm text-foreground/80 line-clamp-6">{n.content}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">آخر تحديث: {fmtDate(n.updatedAt.slice(0, 10))}</p>
                <div className="absolute end-2 top-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    onClick={() => setDialog({ open: true, note: n })}
                    aria-label="تعديل"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <ConfirmDelete itemLabel="الملاحظة" onConfirm={() => deleteNote(n.id)} className="size-7" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog.open} onOpenChange={(v) => setDialog({ open: v })}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader className="text-start">
            <DialogTitle>{dialog.note ? "تعديل الملاحظة" : "ملاحظة جديدة"}</DialogTitle>
          </DialogHeader>
          {dialog.open ? (
            <NoteFormInner
              key={dialog.note?.id ?? "new"}
              note={dialog.note}
              close={() => setDialog({ open: false })}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
