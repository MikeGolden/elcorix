import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentLanguage, useUnlocalizedPath } from "../i18n/useLanguage";
import {
  alternateLinks,
  canonicalUrl,
  composeTitle,
  ogAlternateLocales,
  ogLocaleFor,
} from "./meta";
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

/** og:locale:alternate is a repeated tag — rewrite the set, not one tag. */
function setMetaListByProperty(property: string, values: string[]) {
  const existing = document.head.querySelectorAll<HTMLMetaElement>(
    `meta[property="${property}"]`,
  );
  existing.forEach((tag) => tag.remove());
  for (const value of values) {
    const tag = document.createElement("meta");
    tag.setAttribute("property", property);
    tag.content = value;
    document.head.appendChild(tag);
  }
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
 * The alternates are a set of tags, one per language plus x-default, so
 * they are replaced wholesale rather than patched — the language changes
 * but the set never does, and a leftover tag from the previous route would
 * point crawlers at the wrong page.
 */
function setAlternates(path: string) {
  document.head
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((tag) => tag.remove());
  for (const alternate of alternateLinks(path)) {
    const tag = document.createElement("link");
    tag.rel = "alternate";
    tag.hreflang = alternate.hreflang;
    tag.href = alternate.href;
    document.head.appendChild(tag);
  }
}

/**
 * Per-route, per-language document metadata: title, description, canonical
 * URL, hreflang alternates and Open Graph tags. `metaKey` addresses
 * `meta.<key>.title` / `meta.<key>.description` in the translations.
 *
 * These tags already exist in the served HTML — `vite/seoPrerender.ts`
 * writes a full set into every language's shell of every route, for the
 * crawlers that never run this code. What happens here is the refresh after
 * a client-side navigation: the same tags, for the route and language the
 * router just landed on. The rules are shared with the build step through
 * `./meta`, so the two cannot disagree.
 *
 * Since every page now has its own URL per language, the hreflang set is
 * real: `/de/prices`, `/en/prices`, `/uk/prices`, `/ru/prices` declare each other.
 */
export function usePageMeta(metaKey: MetaKey): void {
  const { t } = useTranslation();
  const language = useCurrentLanguage();
  const path = useUnlocalizedPath();

  useEffect(() => {
    const title = composeTitle(path, t(`meta.${metaKey}.title`));
    const description = t(`meta.${metaKey}.description`);
    const url = canonicalUrl(language, path);

    document.title = title;
    setMetaByName("description", description);
    setCanonical(url);
    setAlternates(path);
    setMetaByProperty("og:title", title);
    setMetaByProperty("og:description", description);
    setMetaByProperty("og:url", url);
    setMetaByProperty("og:locale", ogLocaleFor(language));
    setMetaListByProperty("og:locale:alternate", ogAlternateLocales(language));
  }, [t, language, path, metaKey]);
}
