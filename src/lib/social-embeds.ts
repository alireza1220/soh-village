import type { L } from "./i18n";

// Public posts from the village Facebook page (facebook.com/sohiran) and Instagram
// (@soh_village), found 24 Nov 2026. Notes follow the caption. The posts were not watched through.
export type SocialPost = {
  id: string;
  platform: "facebook" | "instagram";
  title: L;
  account: string;
  href: string;
  embed: string;
  tall?: boolean;
  sections: string[];
  note: L;
};

const fbVideo = (id: string) => {
  const href = `https://www.facebook.com/sohiran/videos/${id}/`;
  return { href, embed: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(href)}&show_text=true&width=560` };
};

const ig = (code: string, reel = false) => {
  const kind = reel ? "reel" : "p";
  const href = `https://www.instagram.com/${kind}/${code}/`;
  return { href, embed: `${href}embed` };
};

const pageHref = "https://www.facebook.com/sohiran";

export const socialPosts: SocialPost[] = [
  {
    id: "fb-page",
    platform: "facebook",
    title: { fa: "صفحه‌ی فیسبوک روستای تاریخی سُه", en: "Facebook page of the historic village of Soh" },
    account: "facebook.com/sohiran",
    href: pageHref,
    embed: `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(pageHref)}&tabs=timeline&width=500&height=720&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false`,
    tall: true,
    sections: ["history", "tourism"],
    note: { fa: "حدود ۹۳۰ دنبال‌کننده. خط زمان صفحه این‌جا نشان داده می‌شود. گروه فیسبوک جداست و قاب عمومی ندارد.", en: "About 930 followers. The page timeline is shown here. The Facebook group is separate and has no public frame." },
  },
  {
    id: "fb-1135067186115108",
    platform: "facebook",
    title: { fa: "خاطرات ادوارد براون و اقامت در تلگراف‌خانه‌ی روستا", en: "Edward Brown’s memories, and a stay at the village telegraph house" },
    account: "روستای تاریخی سُه",
    ...fbVideo("1135067186115108"),
    sections: ["history"],
    note: { fa: "عنوان صفحه: گردآوری و اجرای سید علی میرمطلبی سُهی، از گذر براون از روستاهایی چون قهرود و رسیدن به سُه. فیلم با کتاب براون مقابله نشده است.", en: "The page title says Seyed Ali Mir Motallebi Sohi gathered and performed Brown’s account of passing villages such as Qohrud and reaching Soh. The film has not been checked against Brown’s book." },
  },
  {
    id: "fb-2330617824396559",
    platform: "facebook",
    title: { fa: "باران و آب ناودان‌های کاروانسرا", en: "Rain, and water from the caravanserai downspouts" },
    account: "روستای تاریخی سُه",
    ...fbVideo("2330617824396559"),
    sections: ["history", "tourism"],
    note: { fa: "عنوان صفحه می‌گوید باران هفته‌ی گذشته و جاری شدن آب از ناودان‌های کاروانسرا.", en: "The page title says last week’s rain and water running from the caravanserai downspouts." },
  },
  {
    id: "fb-1844910826512349",
    platform: "facebook",
    title: { fa: "بارش باران هفته‌ی گذشته", en: "Last week’s rain" },
    account: "روستای تاریخی سُه",
    ...fbVideo("1844910826512349"),
    sections: ["tourism"],
    note: { fa: "عنوان صفحه همین است و جای دقیق را نام نمی‌برد.", en: "That is the whole page title. It does not name the exact place." },
  },
  {
    id: "fb-1181853784502986",
    platform: "facebook",
    title: { fa: "نام روستای سُه روی نقشه‌ی سال ۱۸۹۸", en: "The name of Soh on an 1898 map" },
    account: "روستای تاریخی سُه",
    ...fbVideo("1181853784502986"),
    sections: ["history", "map"],
    note: { fa: "عنوان صفحه: نام روستا روی نقشه‌ی ۱۸۹۸ و نقشه‌ی جاهای دیگر ایران. خود نقشه این‌جا بررسی نشده است.", en: "The page title says the village name on an 1898 map and a map of other places in Iran. The map itself has not been examined here." },
  },
  {
    id: "fb-1158790489943262",
    platform: "facebook",
    title: { fa: "تصویری زیبا از کاربر گرامی", en: "A picture sent by a follower" },
    account: "روستای تاریخی سُه",
    ...fbVideo("1158790489943262"),
    sections: ["tourism"],
    note: { fa: "عنوان صفحه همین جمله است و موضوع تصویر را نمی‌گوید.", en: "That sentence is the whole page title. It does not say what the picture shows." },
  },
  {
    id: "ig-CRI65RKMzfY",
    platform: "instagram",
    title: { fa: "تصاویری از کاروانسرا", en: "Pictures of the caravanserai" },
    account: "@soh_village",
    ...ig("CRI65RKMzfY"),
    tall: true,
    sections: ["history"],
    note: { fa: "عنوان پست، ۲۰ تیر ۱۴۰۰: تصاویر زیبا از کاروانسرا.", en: "Post title, 10 July 2021: beautiful pictures of the caravanserai." },
  },
  {
    id: "ig-De9o8LivWrL",
    platform: "instagram",
    title: { fa: "عمارت فرنگی، به گفته‌ی صفحه", en: "The Farangi mansion, as the account describes it" },
    account: "@soh_village",
    ...ig("De9o8LivWrL", true),
    tall: true,
    sections: ["history"],
    note: { fa: "عنوان پست، ۴ آبان ۱۴۰۵، می‌گوید مرمت غیراصولی باعث شده این تصویرها را دیگر در بنا نبینید. این گفته‌ی صفحه است و بازدید این سایت نیست.", en: "The post of 26 Oct 2026 says careless repairs mean you will no longer see these pictures on the building. That is the account’s caption, not a visit by this site." },
  },
  {
    id: "ig-DfuHMEDp7Ik",
    platform: "instagram",
    title: { fa: "کوچه‌های قلعه‌ی بالا در گذشته", en: "Lanes of the upper castle in the past" },
    account: "@soh_village",
    ...ig("DfuHMEDp7Ik", true),
    tall: true,
    sections: ["history"],
    note: { fa: "عنوان پست، ۲۳ آبان ۱۴۰۵، و برچسب «ویدیوی هوش مصنوعی». پس عکس قدیمی کوچه‌ها دانسته نشده است.", en: "The post of 14 Nov 2026 carries an “AI video” tag, so it is not treated as an old photograph of the lanes." },
  },
  {
    id: "ig-Df2e_Nun3d",
    platform: "instagram",
    title: { fa: "بازسازی تصویر شاه‌نشین کاروانسرا", en: "A reconstructed picture of the caravanserai’s shahneshin" },
    account: "@soh_village",
    ...ig("Df2e_Nun3d-"),
    tall: true,
    sections: ["history"],
    note: { fa: "عنوان پست، ۲۶ آبان ۱۴۰۵، خودش می‌گوید بازسازی تصویر است، با مظفرالدین‌شاه و سربازان روی بام. عکس آن زمان نیست.", en: "The post of 17 Nov 2026 calls itself a reconstructed picture, with Mozaffar al-Din Shah and soldiers on the roof. It is not a photograph from that time." },
  },
  {
    id: "ig-Df2oSOnzWn9",
    platform: "instagram",
    title: { fa: "نام سُه روی نقشه‌ی ۱۸۹۸", en: "The name of Soh on the 1898 map" },
    account: "@soh_village",
    ...ig("Df2oSOnzWn9", true),
    tall: true,
    sections: ["history", "map"],
    note: { fa: "عنوان پست، ۲۶ آبان ۱۴۰۵. همان موضوع ویدیوی فیسبوک است.", en: "Post of 17 Nov 2026. The same subject as the Facebook video." },
  },
  {
    id: "ig-DfrziH-ydVf",
    platform: "instagram",
    title: { fa: "نام سُه روی نقشه‌ی ۱۸۴۳", en: "The name of Soh on an 1843 map" },
    account: "@soh_village",
    ...ig("DfrziH-ydVf", true),
    tall: true,
    sections: ["history", "map"],
    note: { fa: "عنوان پست، ۲۲ آبان ۱۴۰۵: نام روستا روی نقشه‌ی ۱۸۴۳ و تصویر جاهای دیگر ایران. نقشه این‌جا بررسی نشده است.", en: "Post of 13 Nov 2026: the village name on an 1843 map and pictures of other places in Iran. The map has not been examined here." },
  },
  {
    id: "ig-DQPCBrakRsL",
    platform: "instagram",
    title: { fa: "اواخر پاییز ۱۳۹۴", en: "Late autumn 1394" },
    account: "@soh_village",
    ...ig("DQPCBrakRsL"),
    tall: true,
    sections: ["tourism"],
    note: { fa: "عنوان پست همین است.", en: "That is the post title." },
  },
  {
    id: "ig-DCevgpXSs7y",
    platform: "instagram",
    title: { fa: "طبیعت پاییزی، از فهیمه سُهی", en: "Autumn landscape, from Fahimeh Sohi" },
    account: "@soh_village",
    ...ig("DCevgpXSs7y"),
    tall: true,
    sections: ["tourism"],
    note: { fa: "عنوان پست، ۲۶ آبان ۱۴۰۳: تصاویر پاییزی روستا از خانم فهیمه سُهی.", en: "Post of 17 Nov 2024: autumn pictures of the village from Fahimeh Sohi." },
  },
  {
    id: "ig-CqjH0b5S07v",
    platform: "instagram",
    title: { fa: "چند تصویر از طبیعت روستا", en: "A few pictures of the village landscape" },
    account: "@soh_village",
    ...ig("CqjH0b5S07v"),
    tall: true,
    sections: ["tourism"],
    note: { fa: "عنوان پست، ۱۳ فروردین ۱۴۰۲.", en: "Post of 2 April 2023." },
  },
  {
    id: "ig-DaAhp7EGqQ1",
    platform: "instagram",
    title: { fa: "تصاویر روز تاسوعا", en: "Pictures from Tasua" },
    account: "@soh_village",
    ...ig("DaAhp7EGqQ1"),
    tall: true,
    sections: ["traditions"],
    note: { fa: "عنوان پست، ۴ تیر ۱۴۰۵: تصاویر روز تاسوعا از مجتبی میرمطلبی و داوود اسماعیلی.", en: "Post of 25 June 2026: Tasua pictures from Mojtaba Mir Motallebi and Davoud Esmaeili." },
  },
];

export function socialFor(section: string) {
  return socialPosts.filter((p) => p.sections.includes(section));
}

const SECTION_TITLE: Record<string, L> = {
  history: { fa: "تاریخ", en: "History" },
  tourism: { fa: "گردشگری", en: "Tourism" },
  traditions: { fa: "آیین‌ها", en: "Traditions" },
  map: { fa: "نقشه", en: "Map" },
};

export function socialSectionTitle(slug: string): L {
  return SECTION_TITLE[slug] ?? { fa: slug, en: slug };
}
