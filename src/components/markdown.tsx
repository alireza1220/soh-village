import ReactMarkdown, { type Components } from "react-markdown";
import "@/styles/markdown.css";

// Safe Markdown for admin-written posts. react-markdown builds React elements (no innerHTML): raw HTML in the text is dropped
// (skipHtml), only the elements below are allowed (no images, no tables, no iframes), link addresses go through the default
// URL sanitiser (http, https, mailto, tel only) and every link opens in a new tab with rel noopener / nofollow / ugc.
// h1 is shown as h2 and so on, because the page already has its own h1.
const ALLOWED = ["p", "br", "strong", "em", "del", "a", "ul", "ol", "li", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6", "code", "pre", "hr"];

const components: Components = {
  h1: ({ children }) => <h2>{children}</h2>,
  h2: ({ children }) => <h2>{children}</h2>,
  h3: ({ children }) => <h3>{children}</h3>,
  h4: ({ children }) => <h4>{children}</h4>,
  h5: ({ children }) => <h4>{children}</h4>,
  h6: ({ children }) => <h4>{children}</h4>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc">
      {children}
    </a>
  ),
};

/** `lang` is the language of the TEXT (sets direction); pass the language the text is actually written in. */
export function Markdown({ text, lang, className }: { text: string; lang: "fa" | "en"; className?: string }) {
  return (
    <div className={`md${className ? ` ${className}` : ""}`} lang={lang} dir={lang === "fa" ? "rtl" : "ltr"}>
      <ReactMarkdown skipHtml allowedElements={ALLOWED} unwrapDisallowed components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
