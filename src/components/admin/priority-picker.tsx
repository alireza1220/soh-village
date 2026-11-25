"use client";
import type { Locale } from "@/lib/i18n";
import { POST_PRIORITIES, type PostPriority } from "@/lib/posts";
import { PriorityIcon } from "@/lib/admin-icons";

export const PRIORITY_LABEL: Record<PostPriority, { fa: string; en: string }> = {
  normal: { fa: "عادی", en: "Normal" },
  featured: { fa: "ویژه", en: "Featured" },
  urgent: { fa: "فوری", en: "Urgent" },
};

const HINT: Record<PostPriority, { fa: string; en: string }> = {
  normal: { fa: "فقط در فهرست اخبار نمایش داده می‌شود.", en: "Shown in the news list only." },
  featured: { fa: "پایین‌تر در صفحه‌ی اصلی به‌صورت یک نوار ویژه نمایش داده می‌شود (تخفیف‌ها، مطالب مهم).", en: "Shown lower on the home page as a highlight (offers, important posts)." },
  urgent: {
    fa: "خبر اصلی: یک بنر در بالاترین جای صفحه‌ی اصلی. برای موارد اضطراری. یادتان باشد وقتی تمام شد دوباره روی «عادی» بگذارید.",
    en: "Main news: a banner at the very top of the home page. Use for emergencies. Remember to set it back to Normal when it is over.",
  },
};
const T = {
  legend: { fa: "اولویت نمایش", en: "Priority" },
  unpublished: { fa: "تا وقتی منتشر نشود، نمایش داده نمی‌شود.", en: "It will not show until published." },
};

export function PriorityPicker({ lang, value, onChange, published, disabled }: {
  lang: Locale; value: PostPriority; onChange: (p: PostPriority) => void; published: boolean; disabled?: boolean;
}) {
  return (
    <fieldset className="adm-prio" disabled={disabled}>
      <legend className="label">{T.legend[lang]}</legend>
      <div className="adm-prio__opts">
        {POST_PRIORITIES.map((p) => (
          <label key={p} className={`adm-prio__opt adm-prio__opt--${p}`}>
            <input type="radio" name="adm-priority" value={p} checked={value === p} onChange={() => onChange(p)} aria-describedby={`adm-prio-h-${p}`} />
            <span className="adm-prio__face">
              <PriorityIcon priority={p} size={20} />
              <span>{PRIORITY_LABEL[p][lang]}</span>
            </span>
          </label>
        ))}
      </div>
      {POST_PRIORITIES.map((p) => (
        <span key={p} id={`adm-prio-h-${p}`} className="field-hint" hidden={value !== p}>{HINT[p][lang]}</span>
      ))}
      <p className="adm-prio__warn" role="status" aria-live="polite">{value === "urgent" && !published ? T.unpublished[lang] : ""}</p>
    </fieldset>
  );
}
