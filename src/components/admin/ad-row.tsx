"use client";
import type { Locale } from "@/lib/i18n";
import type { AdminListing, ListingStatus } from "@/lib/admin-types";
import { BOARDS, categoryLabel, factsOf, typeLabel } from "@/lib/boards";
import { imageUrl } from "@/lib/listing-images";
import { publicSupabase } from "@/lib/supabase";
import { VerifiedBadge } from "@/components/verified-badge";
import { fmtDate } from "./admin-api";

const T = {
  status: { pending: { fa: "در انتظار", en: "Pending" }, approved: { fa: "تأییدشده", en: "Approved" }, rejected: { fa: "ردشده", en: "Rejected" }, removed: { fa: "برداشته‌شده", en: "Removed" } },
  approve: { fa: "تأیید", en: "Approve" },
  reject: { fa: "رد کردن", en: "Reject" },
  remove: { fa: "برداشتن", en: "Remove" },
  restore: { fa: "برگرداندن به انتظار", en: "Back to pending" },
  poster: { fa: "آگهی‌دهنده", en: "Posted by" },
  unknown: { fa: "نامشخص", en: "Unknown" },
  created: { fa: "ثبت", en: "Created" },
  approvedAt: { fa: "تأیید", en: "Approved" },
  expires: { fa: "انقضا", en: "Expires" },
  photo: { fa: "عکس", en: "Photo" },
  details: { fa: "توضیحات", en: "Details" },
};

/** One ad as the admin sees it, with its status buttons. The row is replaced by the server's answer, never guessed. */
export function AdRow({ lang, ad, busy, onSet }: { lang: Locale; ad: AdminListing; busy: boolean; onSet: (ad: AdminListing, s: ListingStatus) => void }) {
  const sb = publicSupabase();
  const facts = factsOf(ad.board, ad, lang);
  const who = ad.poster ? `${ad.poster.firstName} ${ad.poster.familyName}`.trim() : "";
  const s = ad.status;
  return (
    <li className="adm-card" data-status={s} id={`adm-ad-${ad.id}`}>
      <div className="adm-card__top">
        <span className={`adm-badge adm-badge--${s}`}>{T.status[s][lang]}</span>
        <span className="chip">{BOARDS[ad.board].title[lang]}</span>
        <span className="chip">{typeLabel(ad.board, ad.type, lang)}</span>
        <span className="chip">{categoryLabel(ad.board, ad.category, lang)}</span>
      </div>
      <h3 className="adm-card__title" id={`adm-ad-h-${ad.id}`} tabIndex={-1}><bdi>{ad.title}</bdi></h3>
      {facts.length > 0 && (
        <p className="adm-facts">{facts.map((f) => <span key={f.label}>{f.label}: <bdi>{f.value}</bdi></span>)}</p>
      )}
      {ad.details && <p className="adm-details"><b>{T.details[lang]}: </b><bdi>{ad.details}</bdi></p>}
      {sb && ad.images.length > 0 && (
        <ul className="adm-thumbs">
          {ad.images.map((name, i) => (
            <li key={name}>
              <a href={imageUrl(sb.url, ad.id, name)} target="_blank" rel="noopener noreferrer" aria-label={`${T.photo[lang]} ${i + 1}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl(sb.url, ad.id, name, "thumb")} alt="" loading="lazy" width={72} height={72} />
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="adm-meta">
        <span>{T.poster[lang]}: <b><bdi>{who || T.unknown[lang]}</bdi></b>{ad.poster?.verified && <> <VerifiedBadge lang={lang} compact /></>}{ad.poster?.phone && <> · <bdi dir="ltr" className="adm-phone">{ad.poster.phone}</bdi></>}</span>
        <span>{T.created[lang]}: {fmtDate(ad.createdAt, lang, true)}</span>
        {ad.approvedAt && <span>{T.approvedAt[lang]}: {fmtDate(ad.approvedAt, lang)}</span>}
        <span>{T.expires[lang]}: {fmtDate(ad.expiresAt, lang)}</span>
      </p>
      <div className="adm-row">
        {s !== "approved" && s !== "removed" && <button type="button" className="btn btn--primary" disabled={busy} onClick={() => onSet(ad, "approved")}>{T.approve[lang]}</button>}
        {s !== "rejected" && s !== "removed" && <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => onSet(ad, "rejected")}>{T.reject[lang]}</button>}
        {s !== "pending" && <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => onSet(ad, "pending")}>{T.restore[lang]}</button>}
        {s !== "removed" && <button type="button" className="btn btn--quiet-danger adm-end" disabled={busy} onClick={() => onSet(ad, "removed")}>{T.remove[lang]}</button>}
      </div>
    </li>
  );
}
