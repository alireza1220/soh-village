"use client";
import { useEffect, useId, useRef } from "react";
import type { Locale } from "@/lib/i18n";

const T = { cancel: { fa: "انصراف", en: "Cancel" } };

/** A small modal question (native <dialog>: focus is trapped, Esc cancels). */
export function ConfirmDialog({ lang, open, title, text, confirmLabel, busy, onConfirm, onCancel }: {
  lang: Locale; open: boolean; title: string; text: string; confirmLabel: string; busy?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const uid = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { d.showModal(); cancelRef.current?.focus(); } // focus the safe choice, not the destructive one
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="adm-dialog" aria-labelledby={`${uid}-t`} aria-describedby={`${uid}-d`} onCancel={(e) => { e.preventDefault(); onCancel(); }}>
      <h3 id={`${uid}-t`}>{title}</h3>
      <p id={`${uid}-d`}>{text}</p>
      <div className="adm-row">
        <button type="button" className="btn btn--primary" onClick={onConfirm} disabled={busy}>{confirmLabel}</button>
        <button ref={cancelRef} type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>{T.cancel[lang]}</button>
      </div>
    </dialog>
  );
}
