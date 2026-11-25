"use client";
// One cover image per post. Picks a file, resizes it in the browser (1280 px full + 400 px thumb, same helpers as the listing
// photo picker) and holds the result; the editor uploads it on Save. Controlled: value = { stored, fresh }.
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { PhotoError, processImage, type ProcessedImage } from "@/lib/image-resize";
import { errorText } from "@/lib/api-errors";
import { postImageUrl } from "@/lib/posts";
import { publicSupabase } from "@/lib/supabase";

/** stored: cover file name on the server (null = none / removed). fresh: a new image waiting to be uploaded. */
export type CoverValue = { stored: string | null; fresh: ProcessedImage | null };

const T = {
  label: { fa: "عکس مطلب (اختیاری)", en: "Cover image (optional)" },
  choose: { fa: "انتخاب عکس", en: "Choose image" },
  replace: { fa: "جایگزین کردن", en: "Replace" },
  remove: { fa: "حذف عکس", en: "Remove image" },
  preparing: { fa: "در حال آماده‌سازی…", en: "Preparing..." },
  ready: { fa: "عکس آماده شد؛ با «ذخیره» فرستاده می‌شود.", en: "Image ready; it is sent when you press Save." },
  removed: { fa: "عکس با «ذخیره» حذف می‌شود.", en: "The image is removed when you press Save." },
  hint: { fa: "فقط یک عکس. در مرورگر کوچک می‌شود و مکان و مشخصات دوربین از آن پاک می‌شود.", en: "One image only. It is shrunk in the browser, and location and camera details are removed." },
  alt: { fa: "پیش‌نمایش عکس مطلب", en: "Cover image preview" },
};

export function CoverPicker({ lang, postId, value, onChange, disabled }: {
  lang: Locale; postId: string | null; value: CoverValue; onChange: (v: CoverValue) => void; disabled?: boolean;
}) {
  const [preparing, setPreparing] = useState(false);
  const [err, setErr] = useState("");
  const [say, setSay] = useState("");
  const [removedPending, setRemovedPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  const mounted = useRef(true);
  useEffect(() => { valueRef.current = value; });
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; if (valueRef.current.fresh) URL.revokeObjectURL(valueRef.current.fresh.previewUrl); }; }, []);

  const sb = publicSupabase();
  const has = !!value.fresh || !!value.stored;
  const src = value.fresh ? value.fresh.previewUrl : value.stored && postId && sb ? postImageUrl(sb.url, postId, value.stored, "thumb") : null;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setErr("");
    setPreparing(true);
    setSay(T.preparing[lang]);
    try {
      const p = await processImage(file);
      if (!mounted.current) { URL.revokeObjectURL(p.previewUrl); return; }
      if (value.fresh) URL.revokeObjectURL(value.fresh.previewUrl);
      onChange({ stored: value.stored, fresh: p });
      setSay(T.ready[lang]);
      setRemovedPending(false);
    } catch (e) {
      const m = errorText(e instanceof PhotoError ? e.code : "unreadable", lang);
      if (mounted.current) { setErr(m); setSay(""); }
    }
    if (mounted.current) setPreparing(false);
  };

  const remove = () => {
    if (value.fresh) URL.revokeObjectURL(value.fresh.previewUrl);
    onChange({ stored: null, fresh: null });
    setSay(T.removed[lang]);
    setRemovedPending(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className="adm-cover">
      <span className="label" id="adm-cover-l">{T.label[lang]}</span>
      <div className="adm-cover__body">
        {src && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview or a small public thumbnail
          <img className="adm-cover__img" src={src} alt={T.alt[lang]} decoding="async" />
        )}
        <div className="adm-cover__side">
          <div className="adm-row">
            <label className={`btn btn--ghost adm-cover__pick${disabled || preparing ? " is-off" : ""}`}>
              <input ref={inputRef} className="adm-cover__input" type="file" accept="image/*" aria-describedby="adm-cover-h" disabled={disabled || preparing} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
              <span>{has ? T.replace[lang] : T.choose[lang]}</span>
            </label>
            {has && <button type="button" className="btn btn--quiet-danger" onClick={remove} disabled={disabled || preparing}>{T.remove[lang]}</button>}
          </div>
          <span id="adm-cover-h" className="field-hint">{T.hint[lang]}</span>
          {preparing && <span className="adm-quiet">{T.preparing[lang]}</span>}
          {value.fresh && !preparing && <span className="adm-quiet">{T.ready[lang]}</span>}
          {removedPending && !has && !preparing && <span className="adm-quiet">{T.removed[lang]}</span>}
          {err && <span className="adm-msg adm-msg--bad" role="alert">{err}</span>}
        </div>
      </div>
      <span className="sr-only" role="status" aria-live="polite">{say}</span>
    </div>
  );
}
