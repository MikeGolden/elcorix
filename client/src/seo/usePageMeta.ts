import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { canonicalUrl, composeTitle, ogLocaleFor } from "./meta";
import type { MetaKey } from "./routes";

export type { MetaKey };

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

/**
 * Per-route, per-language document metadata: title, description,
 * canonical URL and Open Graph tags. `metaKey` addresses
 * `meta.<key>.title` / `meta.<key>.description` in the translations.
 *
 * These tags already exist in the served HTML — `vite/seoPrerender.ts`
 * writes a German set into every route's shell for the crawlers that never
 * run this code. What happens here is the language swap: the same tags,
 * rewritten in the visitor's chosen language. The title and canonical
 * rules are shared with the build step in `./meta` so the two cannot
 * disagree.
 *
 * The three languages share one URL (language is a client-side
 * preference, not a URL segment), so there are deliberately no hreflang
 * alternates — those require distinct URLs per language.
 */
export function usePageMeta(metaKey: MetaKey): void {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  useEffect(() => {
    const title = composeTitle(pathname, t(`meta.${metaKey}.title`));
    const description = t(`meta.${metaKey}.description`);
    const url = canonicalUrl(pathname);

    document.title = title;
    setMetaByName("description", description);
    setCanonical(url);
    setMetaByProperty("og:title", title);
    setMetaByProperty("og:description", description);
    setMetaByProperty("og:url", url);
    setMetaByProperty("og:locale", ogLocaleFor(i18n.resolvedLanguage));
  }, [t, i18n.resolvedLanguage, pathname, metaKey]);
}
