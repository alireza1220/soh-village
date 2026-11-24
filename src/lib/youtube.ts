import type { L } from "./i18n";

// YouTube results for this Soh (Meymeh / Shahin Shahr), searched 24 Nov 2026.
// Titles are the ones YouTube shows. The films were not watched through, so the notes do not describe the pictures.
export type YtVideo = {
  id: string;
  title: L;
  channel: string;
  sections: string[];
  note: L;
};

export const youtubeSearched = { fa: "۳ آذر ۱۴۰۵", en: "24 Nov 2026" };

export const youtubeVideos: YtVideo[] = [
  {
    id: "UAoKM_LclYw",
    title: { fa: "قسمت اول برنامه‌ی «همین حوالی» از روستای تاریخی سُه", en: "Hamin Havali, part one, from the historic village of Soh" },
    channel: "SohiranTube",
    sections: ["history", "tourism"],
    note: { fa: "۳۰ دقیقه. عنوان، روستای تاریخی سُه را نام می‌برد.", en: "30 minutes. The title names the historic village of Soh." },
  },
  {
    id: "CRYftjyC3As",
    title: { fa: "مستندی از روستای سه، پخش‌شده از شبکه‌ی ۴ سیما", en: "A documentary on Soh, broadcast on IRIB Channel 4" },
    channel: "SohiranTube",
    sections: ["history", "tourism"],
    note: { fa: "۱۲ دقیقه. عنوان می‌گوید از شبکه‌ی ۴ پخش شده است.", en: "12 minutes. The title says it was broadcast on Channel 4." },
  },
  {
    id: "3YpD6L8vK9k",
    title: { fa: "روستای تاریخی سُه", en: "The historic village of Soh" },
    channel: "Loveart",
    sections: ["history", "tourism"],
    note: { fa: "۱۲ دقیقه. فایل با پسوند avi در یوتیوب گذاشته شده است.", en: "12 minutes. Uploaded on YouTube as an avi file." },
  },
  {
    id: "iA_dZfn6sFw",
    title: { fa: "چشمه‌ای که جاری شد، روستای سُه", en: "A spring that began to flow, Soh village" },
    channel: "INSOHGRAM",
    sections: ["tourism"],
    note: { fa: "۵۸ دقیقه. عنوان، روستا و یک چشمه را نام می‌برد و نام چشمه را با چشمه‌های فهرست گردشگری یکی نمی‌کند.", en: "58 minutes. The title names the village and a spring. It is not matched to a named spring on the tourism list." },
  },
  {
    id: "2K5q27l0mGI",
    title: { fa: "مستند غربت نخل: مراسم نخل‌برداری از روستای سُه، اصفهان، ۱۴۳۵ قمری", en: "Ghorbat-e Nakhl: the nakhl carrying at Soh, Isfahan, 1435 AH" },
    channel: "شبکه جهانی امام حسین فارسی",
    sections: ["traditions"],
    note: { fa: "۱۳ دقیقه. عنوان، نخل‌گردانی سُه را نام می‌برد.", en: "13 minutes. The title names the nakhl carrying at Soh." },
  },
  {
    id: "dm8fyYCgAk0",
    title: { fa: "آموزش گویش سُهی، قسمت اول", en: "Sohi dialect lesson, part one" },
    channel: "SohiranTube",
    sections: ["words"],
    note: { fa: "۱۰ دقیقه. واژه‌هایش این‌جا رونویسی نشده، چون فیلم را واژه به واژه پیاده نکرده‌ایم.", en: "10 minutes. Its words are not copied here, because the film has not been transcribed word by word." },
  },
  {
    id: "7bLobqt6Bao",
    title: { fa: "آموزش گویش سُهی، قسمت دوم", en: "Sohi dialect lesson, part two" },
    channel: "SohiranTube",
    sections: ["words"],
    note: { fa: "۱۰ دقیقه. مانند قسمت اول، واژه‌ها هنوز وارد جدول گویش نشده‌اند.", en: "10 minutes. As with part one, the words are not in the dialect table yet." },
  },
  {
    id: "ib5k9vmchzA",
    title: { fa: "روستای سُه، شهر کودکی", en: "Soh village, a childhood town" },
    channel: "INSOHGRAM",
    sections: ["tourism"],
    note: { fa: "۵۰ ثانیه.", en: "50 seconds." },
  },
  {
    id: "RM2HJRXP66w",
    title: { fa: "روستای سُه", en: "Soh village" },
    channel: "SohiranTube",
    sections: ["tourism"],
    note: { fa: "۲۳ ثانیه.", en: "23 seconds." },
  },
  {
    id: "uBod-A8Xns0",
    title: { fa: "طبیعت سُه در اوایل بهار", en: "Soh in early spring" },
    channel: "SohiranTube",
    sections: ["tourism"],
    note: { fa: "۲ دقیقه. عنوان، اوایل بهار را می‌گوید.", en: "2 minutes. The title says early spring." },
  },
  {
    id: "onIZz0qNXEQ",
    title: { fa: "عکس‌های طبیعت، مرغزار سرمرق", en: "Nature photos, the Sarmargh meadow" },
    channel: "SohiranTube",
    sections: ["tourism"],
    note: { fa: "۱ دقیقه. سرمرق همان نامی است که کجارو در فهرست طبیعت آورده است.", en: "1 minute. Sarmargh is the meadow name Kojaro lists." },
  },
  {
    id: "9GKlSCMKLzc",
    title: { fa: "دشت سرمرق", en: "The Sarmargh field" },
    channel: "SohiranTube",
    sections: ["tourism"],
    note: { fa: "۲۷ ثانیه. عنوان، سرمرق را نام می‌برد.", en: "27 seconds. The title names Sarmargh." },
  },
  {
    id: "P6MVVmFSbO0",
    title: { fa: "قلعه‌ی تاریخی", en: "Historical castle" },
    channel: "SohiranTube",
    sections: ["history"],
    note: { fa: "۵۴ ثانیه. کانال SohiranTube است. عنوان نمی‌گوید کدام قلعه، پس با قلعه‌ی نچفت یکی گرفته نشده است.", en: "54 seconds. On the SohiranTube channel. The title does not say which castle, so it is not treated as the Nachaft castle." },
  },
  {
    id: "4A_wF-lsBLU",
    title: { fa: "طبیعت بهار", en: "Nature in spring" },
    channel: "SohiranTube",
    sections: ["tourism"],
    note: { fa: "۳ دقیقه. عنوان، جای مشخصی را نام نمی‌برد. روی کانال SohiranTube است.", en: "3 minutes. The title names no particular place. It is on the SohiranTube channel." },
  },
  {
    id: "bx6XOQrBzkA",
    title: { fa: "باغ‌ها", en: "Gardens" },
    channel: "SohiranTube",
    sections: ["tourism"],
    note: { fa: "۱ دقیقه. عنوان، نام باغ را نمی‌گوید.", en: "1 minute. The title does not name the garden." },
  },
  {
    id: "0ZJpaFbkwEw",
    title: { fa: "شکوفه‌ی بهار", en: "Spring blossom" },
    channel: "SohiranTube",
    sections: ["tourism"],
    note: { fa: "۲ دقیقه. روی کانال SohiranTube.", en: "2 minutes. On the SohiranTube channel." },
  },
  {
    id: "KFlZvERx4EM",
    title: { fa: "شکوفه و برف", en: "Blossom and snow" },
    channel: "SohiranTube",
    sections: ["tourism"],
    note: { fa: "۱ دقیقه. روی کانال SohiranTube.", en: "1 minute. On the SohiranTube channel." },
  },
  {
    id: "14kgZHbglow",
    title: { fa: "باغ‌های رهاشده", en: "Abandoned gardens" },
    channel: "SohiranTube",
    sections: ["tourism"],
    note: { fa: "۲ دقیقه. عنوان نمی‌گوید باغ از آنِ چه کسی است.", en: "2 minutes. The title does not say whose gardens these are." },
  },
  {
    id: "OzMJg6V5nrQ",
    title: { fa: "آب چشمه", en: "Spring water" },
    channel: "SohiranTube",
    sections: ["tourism"],
    note: { fa: "۱۴ ثانیه. عنوان، نام چشمه را نمی‌گوید.", en: "14 seconds. The title does not name the spring." },
  },
  {
    id: "tZS7zqdLApM",
    title: { fa: "صدای جوی آب", en: "The sound of a stream" },
    channel: "SohiranTube",
    sections: ["tourism"],
    note: { fa: "۳۸ ثانیه. عنوان، نام رود را نمی‌گوید، پس با رود لب‌چر یکی گرفته نشده است.", en: "38 seconds. The title does not name the river, so it is not treated as the Lab Char river." },
  },
  {
    id: "mZWUmhpKLL0",
    title: { fa: "صدای آب روان", en: "The sound of flowing water" },
    channel: "SohiranTube",
    sections: ["tourism"],
    note: { fa: "۲۸ ثانیه. روی کانال SohiranTube.", en: "28 seconds. On the SohiranTube channel." },
  },
  {
    id: "aHZoQWCLDNs",
    title: { fa: "یک بزغاله", en: "A kid goat" },
    channel: "SohiranTube",
    sections: ["tourism"],
    note: { fa: "۳۰ ثانیه. عنوان، جای فیلم را نمی‌گوید.", en: "30 seconds. The title does not say where it was filmed." },
  },
  {
    id: "fgxikQv9D3E",
    title: { fa: "گل رز", en: "Roses" },
    channel: "SohiranTube",
    sections: ["tourism"],
    note: { fa: "۱۰ ثانیه. عنوان، جای فیلم را نمی‌گوید.", en: "10 seconds. The title does not say where it was filmed." },
  },
];

export function youtubeFor(section: string) {
  return youtubeVideos.filter((v) => v.sections.includes(section));
}

const SECTION_TITLE: Record<string, L> = {
  history: { fa: "تاریخ", en: "History" },
  tourism: { fa: "گردشگری", en: "Tourism" },
  traditions: { fa: "آیین‌ها", en: "Traditions" },
  words: { fa: "گویش", en: "Dialect" },
};

export function sectionTitle(slug: string): L {
  return SECTION_TITLE[slug] ?? { fa: slug, en: slug };
}
