"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "@/styles/market.css";
import "@/styles/account.css";
import type { L, Locale } from "@/lib/i18n";
import { authToken, signOut, updatePassword } from "@/lib/auth";
import { publicSupabase } from "@/lib/supabase";
import { useSession } from "@/components/use-session";
import { useProfile, afterLoginHref, useNextParam } from "@/lib/use-profile";
import { errorText } from "@/lib/api-errors";
import { postJson } from "@/components/listing-api";
import { uploadBlob } from "@/lib/photo-upload";
import { Avatar } from "@/components/avatar";
import { PasswordField } from "@/components/password-field";
import { AvatarError, processAvatar } from "@/lib/avatar-resize";
import { VerifiedBadge } from "@/components/verified-badge";
import { ADDRESS_MAX, ADDRESS_MIN, avatarUrl, cleanAddress, NAME_MAX, normalizePhone, cleanName, passwordProblem, type Profile } from "@/lib/profile";
import type { ProfileFields } from "@/lib/api-types";
import { loginHref } from "@/lib/return-to";

const T = {
  na: { fa: "این بخش هنوز فعال نشده است.", en: "This is not available yet." },
  checking: { fa: "یک لحظه...", en: "One moment..." },
  gate: { fa: "برای دیدن و ویرایش مشخصاتتان، اول وارد شوید.", en: "Log in first to see and edit your profile." },
  login: { fa: "ورود", en: "Log in" },
  loadFail: { fa: "مشخصات بارگذاری نشد.", en: "Could not load your profile." },
  retry: { fa: "دوباره امتحان کنید", en: "Try again" },
  firstTime: { fa: "یک قدم مانده: نام، شماره‌ی موبایل و نشانی‌تان را بنویسید تا بتوانید آگهی بگذارید. نشانی نمایش داده نمی‌شود.", en: "One more step: add your name, mobile and address so you can post ads. The address is never shown." },
  detailsTitle: { fa: "مشخصات", en: "Your details" },
  first: { fa: "نام", en: "First name" },
  family: { fa: "نام خانوادگی", en: "Family name" },
  phone: { fa: "شماره‌ی موبایل", en: "Mobile number" },
  phoneHint: { fa: "برای این لازم است که خریداران بتوانند با شما تماس بگیرند. روی آگهی‌هایتان پنهان است تا وقتی بازدیدکننده «نمایش شماره» را بزند. با پیامک تأیید نمی‌شود.", en: "Needed so buyers can reach you. Hidden on your ads until a visitor taps «Show phone». We do not verify it by SMS." },
  address: { fa: "نشانی منزل", en: "Home address" },
  addressHint: { fa: "برای گذاشتن آگهی لازم است. به هیچ‌کس نمایش داده نمی‌شود. فقط مدیران سایت آن را می‌بینند تا بتوانند فروشنده‌ها را تأیید کنند.", en: "Needed to post. Never shown to anyone. Only site admins can see it, so they can verify sellers." },
  addressOld: { fa: "یک چیز دیگر مانده: نشانی‌تان را اضافه کنید (خصوصی می‌ماند) تا بتوانید آگهی بگذارید.", en: "One more thing: add your address (it stays private) to keep posting." },
  notVerified: { fa: "هنوز تأیید نشده‌اید. ممکن است یک مدیر برای تأیید شما سر بزند.", en: "Not verified yet. An admin may visit to verify you." },
  verifiedTitle: { fa: "وضعیت تأیید", en: "Verification" },
  phoneNow: { fa: "شماره‌ی ثبت‌شده:", en: "Number on file:" },
  show: { fa: "نامم و عکسم روی آگهی‌هایم دیده شود", en: "Show my first name and picture on my ads" },
  showHint: { fa: "نام خانوادگی، نشانی و ایمیل هرگز نمایش داده نمی‌شود. شماره‌تان هم فقط وقتی بازدیدکننده «نمایش شماره» را بزند.", en: "Your family name, address and email are never shown. Your number appears only when a visitor taps «Show phone»." },
  save: { fa: "ذخیره", en: "Save" },
  saving: { fa: "در حال ذخیره...", en: "Saving..." },
  saved: { fa: "ذخیره شد.", en: "Saved." },
  pic: { fa: "عکس پروفایل", en: "Profile picture" },
  picHint: { fa: "اختیاری. عکس خیلی کوچک می‌شود.", en: "Optional. We make it very small." },
  choose: { fa: "انتخاب عکس", en: "Choose a picture" },
  change: { fa: "تغییر عکس", en: "Change picture" },
  remove: { fa: "حذف عکس", en: "Remove picture" },
  picNote: { fa: "برای ثبت عکس، «ذخیره» را بزنید.", en: "Press Save to keep the picture." },
  preparing: { fa: "در حال آماده‌سازی عکس...", en: "Preparing the picture..." },
  uploading: { fa: "در حال فرستادن عکس...", en: "Sending the picture..." },
  email: { fa: "ایمیل", en: "Email" },
  account: { fa: "حساب من", en: "My account" },
  pwTitle: { fa: "رمز عبور", en: "Password" },
  pwText: { fa: "با رمز می‌توانید بدون لینک ایمیل وارد شوید. اگر با لینک وارد شده‌اید، همین‌جا یک رمز بگذارید.", en: "A password lets you log in without an email link. If you came in by link, set one here." },
  pwNew: { fa: "رمز جدید", en: "New password" },
  pwConfirm: { fa: "رمز جدید را دوباره بنویسید", en: "Type the new password again" },
  pwSave: { fa: "ذخیره‌ی رمز", en: "Save password" },
  pwSaved: { fa: "رمز ذخیره شد.", en: "Password saved." },
  my: { fa: "آگهی‌های من", en: "My ads" },
  out: { fa: "خروج", en: "Log out" },
} satisfies Record<string, L>;

type Draft = { first: string; family: string; phone: string; address: string; show: boolean };
type Pic = { phase: "idle" | "preparing" | "uploading" | "ready"; name?: string | null; previewUrl?: string; progress?: number };

export function ProfileClient({ lang }: { lang: Locale }) {
  const router = useRouter();
  const configured = !!publicSupabase();
  const { session, ready } = useSession();
  const prof = useProfile();
  const nextParam = useNextParam();
  const [draft, setDraft] = useState<Draft>({ first: "", family: "", phone: "", address: "", show: true });
  const [filled, setFilled] = useState(false);
  const [errors, setErrors] = useState<{ first?: string; family?: string; phone?: string; address?: string }>({});
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pic, setPic] = useState<Pic>({ phase: "idle" });
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | undefined>(undefined);

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  // Fill the form once, when the profile has been loaded (or is known to be missing).
  if (!filled && (prof.status === "ready" || prof.status === "none")) {
    setFilled(true);
    if (prof.profile) {
      const p = prof.profile;
      setDraft({ first: p.firstName, family: p.familyName, phone: p.phone, address: p.address, show: p.showOnAds });
      setPic({ phase: "idle", name: p.avatar });
    }
  }

  const uid = session?.user.id ?? "";
  const sb = publicSupabase();
  const savedAvatar = prof.profile?.avatar ?? null;
  const shownName = pic.phase === "idle" || pic.phase === "ready" ? pic.name ?? null : pic.name ?? null;
  const picSrc = pic.previewUrl ?? (shownName && sb && uid ? avatarUrl(sb.url, `${uid}/${shownName}`) : null);
  const fullName = `${draft.first} ${draft.family}`.trim();

  const setPreview = (url: string | undefined) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setStatus(null);
    setPic((p) => ({ ...p, phase: "preparing" }));
    try {
      const out = await processAvatar(file);
      setPreview(out.previewUrl);
      setPic({ phase: "uploading", name: pic.name, previewUrl: out.previewUrl, progress: 0 });
      const token = await authToken();
      if (!token) throw new AvatarError("encode_failed");
      const r = await postJson("/api/profile", { action: "avatar_sign", ext: out.ext }, token);
      const up = r.data.upload as { url?: string } | undefined;
      const name = r.data.name as string | undefined;
      if (!r.ok || !up?.url || !name) {
        setPreview(undefined);
        setPic({ phase: "idle", name: pic.name });
        return setStatus({ ok: false, text: errorText((r.data.error as string) || (r.status === 0 ? "network" : "bad_avatar"), lang) });
      }
      const err = await uploadBlob(up.url, out.blob, (l) => setPic((p) => ({ ...p, progress: out.blob.size ? l / out.blob.size : 0 })));
      if (err) {
        setPreview(undefined);
        setPic({ phase: "idle", name: pic.name });
        return setStatus({ ok: false, text: errorText(err === "network" ? "network" : "bad_avatar", lang) });
      }
      setPic({ phase: "ready", name, previewUrl: out.previewUrl });
    } catch (err) {
      setPreview(undefined);
      setPic((p) => ({ phase: "idle", name: p.name }));
      setStatus({ ok: false, text: errorText(err instanceof AvatarError ? err.code : "unreadable", lang) });
    }
  };

  const removePic = () => {
    setPreview(undefined);
    setPic({ phase: "idle", name: null });
    setStatus(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || pic.phase === "preparing" || pic.phase === "uploading") return;
    const first = cleanName(draft.first);
    const family = cleanName(draft.family);
    const phone = normalizePhone(draft.phone);
    const address = cleanAddress(draft.address);
    const errs = {
      address: !address ? errorText("address_required", lang) : address.length < ADDRESS_MIN || address.length > ADDRESS_MAX ? errorText("bad_address", lang) : undefined,
      first: first ? undefined : errorText("first_name_required", lang),
      family: family ? undefined : errorText("family_name_required", lang),
      phone: phone ? undefined : errorText("bad_phone", lang),
    };
    setErrors(errs);
    setStatus(null);
    if (errs.first || errs.family || errs.phone || errs.address) {
      const id = errs.first ? "pf-first" : errs.family ? "pf-family" : errs.phone ? "pf-phone" : "pf-address";
      window.setTimeout(() => document.getElementById(id)?.focus(), 0);
      return;
    }
    const fields: ProfileFields = { firstName: first, familyName: family, phone: phone!, address, showOnAds: draft.show };
    const newAvatar = pic.name ?? null;
    if (newAvatar !== savedAvatar) fields.avatar = newAvatar;
    setBusy(true);
    const token = await authToken();
    const r = token ? await postJson("/api/profile", { action: "save", fields }, token) : null;
    setBusy(false);
    if (!r || !r.ok || !r.data.profile) {
      return setStatus({ ok: false, text: errorText(r ? ((r.data.error as string) || (r.status === 0 ? "network" : undefined)) : "unauthorized", lang) });
    }
    const saved = r.data.profile as Profile;
    const wasMissing = prof.status !== "ready";
    prof.set(saved);
    setDraft({ first: saved.firstName, family: saved.familyName, phone: saved.phone, address: saved.address, show: saved.showOnAds });
    setPreview(undefined);
    setPic({ phase: "idle", name: saved.avatar });
    if (wasMissing) {
      router.replace(afterLoginHref(lang, true, nextParam));
      return;
    }
    setStatus({ ok: true, text: `${T.saved[lang]}` });
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwBusy) return;
    setPwStatus(null);
    const p = passwordProblem(pw);
    if (p) return setPwStatus({ ok: false, text: errorText(p, lang) });
    if (pw !== pw2) return setPwStatus({ ok: false, text: errorText("password_mismatch", lang) });
    setPwBusy(true);
    const r = await updatePassword(pw);
    setPwBusy(false);
    if (!r.ok) return setPwStatus({ ok: false, text: errorText(r.error, lang) });
    setPw("");
    setPw2("");
    setPwStatus({ ok: true, text: T.pwSaved[lang] });
  };

  const logOut = async () => {
    await signOut();
    router.push(`/${lang}`);
  };

  if (!configured) return <div className="mk-stack mk-narrow"><div className="notice"><p>{T.na[lang]}</p></div></div>;
  if (!ready || (session && (prof.status === "loading" || (!filled && prof.status !== "error")))) {
    return <div className="mk-stack mk-narrow"><p className="muted" aria-live="polite">{T.checking[lang]}</p></div>;
  }
  if (!session) {
    return (
      <div className="mk-stack mk-narrow">
        <div className="mk-panel">
          <p style={{ margin: 0 }}>{T.gate[lang]}</p>
          <div>
            <Link className="btn btn--primary" href={loginHref(lang, `/${lang}/profile${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`)}>{T.login[lang]}</Link>
          </div>
        </div>
      </div>
    );
  }
  if (prof.status === "error") {
    return (
      <div className="mk-stack mk-narrow">
        <div className="mk-panel">
          <p style={{ margin: 0 }}>{T.loadFail[lang]}</p>
          <div><button type="button" className="btn btn--primary" onClick={() => void prof.reload()}>{T.retry[lang]}</button></div>
        </div>
      </div>
    );
  }

  const missing = prof.status === "none" && !prof.profile;
  const needsAddress = prof.status === "none" && !!prof.profile && !prof.profile.address;
  const picBusy = pic.phase === "preparing" || pic.phase === "uploading";
  const hasPic = !!picSrc;
  return (
    <div className="mk-stack mk-narrow">
      {missing && <div className="notice"><p>{T.firstTime[lang]}</p></div>}
      {needsAddress && <div className="notice" role="status"><p>{T.addressOld[lang]}</p></div>}
      <form className="mk-panel" onSubmit={save} noValidate aria-labelledby="acc-details">
        <div className="acc-profile-head">
          <Avatar name={fullName || session.user.email} src={picSrc} size={64} />
          <h2 id="acc-details" className="acc-title">{fullName || T.detailsTitle[lang]}</h2>
        </div>

        <div className="field">
          <span className="label" id="acc-pic-label">{T.pic[lang]}</span>
          <div className="acc-avatar-edit" role="group" aria-labelledby="acc-pic-label">
            <div className="acc-avatar-edit__btns">
              <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()} disabled={picBusy}>{hasPic ? T.change[lang] : T.choose[lang]}</button>
              {hasPic && <button type="button" className="btn btn--ghost" onClick={removePic} disabled={picBusy}>{T.remove[lang]}</button>}
            </div>
            <input ref={fileRef} className="acc-file" type="file" accept="image/*" tabIndex={-1} aria-label={T.choose[lang]} onChange={(e) => void onPick(e)} />
          </div>
          {pic.phase === "uploading" && <div className="acc-progress" aria-hidden="true"><span style={{ inlineSize: `${Math.round((pic.progress ?? 0) * 100)}%` }} /></div>}
          <p className="field-hint" aria-live="polite">
            {pic.phase === "preparing" ? T.preparing[lang] : pic.phase === "uploading" ? T.uploading[lang] : (pic.name ?? null) !== savedAvatar ? T.picNote[lang] : T.picHint[lang]}
          </p>
        </div>

        <div className="mk-grid-2">
          <div className="field">
            <label className="label" htmlFor="pf-first">{T.first[lang]}</label>
            <input id="pf-first" className="input" type="text" autoComplete="given-name" maxLength={NAME_MAX} required value={draft.first} onChange={(e) => setDraft({ ...draft, first: e.target.value })} aria-invalid={errors.first ? true : undefined} aria-describedby={errors.first ? "pf-first-err" : undefined} />
            {errors.first && <p id="pf-first-err" className="mk-msg mk-msg--warn">{errors.first}</p>}
          </div>
          <div className="field">
            <label className="label" htmlFor="pf-family">{T.family[lang]}</label>
            <input id="pf-family" className="input" type="text" autoComplete="family-name" maxLength={NAME_MAX} required value={draft.family} onChange={(e) => setDraft({ ...draft, family: e.target.value })} aria-invalid={errors.family ? true : undefined} aria-describedby={errors.family ? "pf-family-err" : undefined} />
            {errors.family && <p id="pf-family-err" className="mk-msg mk-msg--warn">{errors.family}</p>}
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="pf-phone">{T.phone[lang]}</label>
          <input id="pf-phone" className="input" type="tel" inputMode="tel" dir="ltr" autoComplete="tel" placeholder="09121234567" required value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} aria-invalid={errors.phone ? true : undefined} aria-describedby={errors.phone ? "pf-phone-err pf-phone-hint" : "pf-phone-hint"} />
          <p id="pf-phone-hint" className="field-hint">{T.phoneHint[lang]}</p>
          {errors.phone && <p id="pf-phone-err" className="mk-msg mk-msg--warn">{errors.phone}</p>}
        </div>

        <div className={`field${needsAddress ? " acc-needs" : ""}`}>
          <label className="label" htmlFor="pf-address">{T.address[lang]}</label>
          <textarea id="pf-address" className="textarea" rows={2} autoComplete="street-address" minLength={ADDRESS_MIN} maxLength={ADDRESS_MAX} required value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} aria-invalid={errors.address ? true : undefined} aria-describedby={errors.address ? "pf-address-err pf-address-hint" : "pf-address-hint"} />
          <p id="pf-address-hint" className="field-hint">{T.addressHint[lang]}</p>
          {errors.address && <p id="pf-address-err" className="mk-msg mk-msg--warn">{errors.address}</p>}
        </div>

        <div className="acc-verify" aria-label={T.verifiedTitle[lang]}>
          {prof.profile?.verified ? <VerifiedBadge lang={lang} /> : <p className="field-hint">{T.notVerified[lang]}</p>}
        </div>

        <label className="mk-check">
          <input type="checkbox" checked={draft.show} onChange={(e) => setDraft({ ...draft, show: e.target.checked })} />
          <span>
            {T.show[lang]}
            <span className="field-hint">{T.showHint[lang]}</span>
          </span>
        </label>

        <div>
          <button type="submit" className="btn btn--primary" aria-disabled={busy || picBusy || undefined}>{busy ? T.saving[lang] : T.save[lang]}</button>
        </div>
        <div aria-live="polite" role="status" className="mk-live">
          {status && <p className={`mk-msg acc-saved ${status.ok ? "mk-msg--ok" : "mk-msg--warn"}`}>{status.text}{status.ok && draft.phone ? <> {T.phoneNow[lang]} <bdi dir="ltr">{draft.phone}</bdi></> : null}</p>}
        </div>
      </form>

      <section className="mk-panel" aria-labelledby="acc-account">
        <h2 id="acc-account" className="acc-title">{T.account[lang]}</h2>
        <p className="acc-ro">{T.email[lang]}: <bdi dir="ltr" className="acc-email">{session.user.email}</bdi></p>
        <div className="acc-section">
          <h2 id="acc-pw-title">{T.pwTitle[lang]}</h2>
          <p className="acc-sub">{T.pwText[lang]}</p>
          <form onSubmit={savePassword} noValidate aria-labelledby="acc-pw-title" className="mk-stack" style={{ gap: 16 }}>
            <input type="text" className="acc-file" tabIndex={-1} aria-hidden="true" autoComplete="username" readOnly value={session.user.email} />
            <PasswordField id="pf-pw" label={T.pwNew[lang]} value={pw} onChange={setPw} lang={lang} autoComplete="new-password" strength />
            <PasswordField id="pf-pw2" label={T.pwConfirm[lang]} value={pw2} onChange={setPw2} lang={lang} autoComplete="new-password" />
            <div><button type="submit" className="btn btn--primary" aria-disabled={pwBusy || undefined}>{pwBusy ? T.saving[lang] : T.pwSave[lang]}</button></div>
            <div aria-live="polite" role="status" className="mk-live">
              {pwStatus && <p className={`mk-msg ${pwStatus.ok ? "mk-msg--ok" : "mk-msg--warn"}`}>{pwStatus.text}</p>}
            </div>
          </form>
        </div>
        <div className="mk-actions">
          <Link className="btn btn--ghost" href={`/${lang}/my`}>{T.my[lang]}</Link>
          <button type="button" className="btn btn--ghost" onClick={() => void logOut()}>{T.out[lang]}</button>
        </div>
      </section>
    </div>
  );
}
