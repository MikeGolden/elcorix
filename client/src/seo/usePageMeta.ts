import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { business } from "../config";

function setMetaByName(name: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setMetaByProperty(property: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.appendChild(tag);
  }
  tag.href = href;
}

export type MetaKey =
  | "home"
  | "prices"
  | "gallery"
  | "booking"
  | "contact"
  | "privacy"
  | "imprint"
  | "terms"
  | "mission"
  | "notFound";

/**
 * Per-route, per-language document metadata: title, description,
 * canonical URL and Open Graph tags. `metaKey` addresses
 * `meta.<key>.title` / `meta.<key>.description` in the translations.
 *
 * The three languages share one URL (language is a client-side
 * preference, not a URL segment), so there are deliberately no hreflang
 * alternates — those require distinct URLs per language.
 */
export function usePageMeta(metaKey: MetaKey): void {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  useEffect(() => {
    const title =
      pathname === "/"
        ? `${business.name} — ${t(`meta.${metaKey}.title`)}`
        : `${t(`meta.${metaKey}.title`)} — ${business.name}`;
    const description = t(`meta.${metaKey}.description`);
    const url = `${business.siteUrl}${pathname === "/" ? "/" : pathname}`;

    document.title = title;
    setMetaByName("description", description);
    setCanonical(url);
    setMetaByProperty("og:title", title);
    setMetaByProperty("og:description", description);
    setMetaByProperty("og:url", url);
    setMetaByProperty("og:locale", i18n.resolvedLanguage ?? "de");
  }, [t, i18n.resolvedLanguage, pathname, metaKey]);
}
