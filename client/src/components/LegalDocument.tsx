import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { defaultLanguage, localizedPath } from "../i18n/routing";
import {
  cachedLegalDocuments,
  loadLegalDocuments,
  type LegalDocumentKey,
  type LegalDocuments,
} from "../i18n/legalDocuments";
import { useCurrentLanguage } from "../i18n/useLanguage";
import { features as buildFeatures } from "../config";
import type { Features } from "../features";
import { usePageMeta } from "../seo/usePageMeta";
import LegalPage, { LegalSection } from "./LegalPage";
import LocalizedLink from "./LocalizedLink";

/**
 * The legal texts that are too long for the `common` resources: the three
 * contract documents the studio handed over on 15.09.2026 (AGB,
 * Terminbedingungen, Paketbedingungen) and the privacy policy.
 *
 * The German text in `locales/de/legal.json` is the studio's wording,
 * paragraph for paragraph. The other languages are courtesy translations
 * with the SAME shape — same sections, paragraphs and clause numbers,
 * which `legalDocuments.test.ts` enforces — and each one says at the top
 * that only the German page is binding, with a link to it.
 */
export type { LegalDocumentKey };

/** Route of each document; the contract documents come first, in the order the cross-links list them. */
export const legalDocumentPaths: Record<LegalDocumentKey, string> = {
  terms: "/terms",
  appointmentTerms: "/appointment-terms",
  packageTerms: "/package-terms",
  privacy: "/datenschutz",
};

/** The documents that cross-link each other. The privacy policy is not a contract term, so it stays out. */
const contractDocuments: LegalDocumentKey[] = [
  "terms",
  "appointmentTerms",
  "packageTerms",
];

const linkClass =
  "font-medium text-brand-600 underline-offset-4 hover:underline";

/**
 * One block of a section: a paragraph (a "\n" inside is a line break, as in
 * the addresses), a bulleted list, or a sub-heading such as
 * "Widerspruchsrecht" inside "Ihre Rechte".
 */
export type LegalBlock = string | { list: string[] } | { heading: string };

type Section = { title: string; paragraphs: LegalBlock[]; feature?: string };

/**
 * URLs and e-mail addresses in the legal texts become links. A trailing
 * full stop, comma or semicolon ends the sentence, not the link.
 */
const LINKABLE = /(https?:\/\/[^\s]*[^\s.,;:)]|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

function linkify(text: string): ReactNode[] {
  return text.split(LINKABLE).map((part, index) => {
    if (index % 2 === 0) return part;
    const external = part.startsWith("http");
    return (
      <a
        key={index}
        href={external ? part : `mailto:${part}`}
        className={linkClass}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {part}
      </a>
    );
  });
}

function LegalBlockView({ block }: { block: LegalBlock }) {
  if (typeof block === "string") {
    return <p className="whitespace-pre-line">{linkify(block)}</p>;
  }
  if ("list" in block) {
    return (
      <ul className="list-disc space-y-1 pl-5">
        {block.list.map((item) => (
          <li key={item}>{linkify(item)}</li>
        ))}
      </ul>
    );
  }
  return <h3 className="pt-3 font-bold">{block.heading}</h3>;
}

function blockKey(block: LegalBlock, index: number): string {
  if (typeof block === "string") return block;
  return "list" in block ? `list-${index}` : `heading-${block.heading}`;
}

/**
 * A section tagged with `"feature": "altegio"` describes an integration
 * that is behind a build-time flag; it is shown only when that flag is on,
 * so the policy never describes a service the site does not load.
 */
function isShown(section: Section, features: Features): boolean {
  return (
    section.feature === undefined ||
    features[section.feature as keyof Features] === true
  );
}

export default function LegalDocument({
  document,
  features = buildFeatures,
}: {
  document: LegalDocumentKey;
  features?: Features;
}) {
  const { t } = useTranslation();
  const language = useCurrentLanguage();
  usePageMeta(document);
  const [documents, setDocuments] = useState<LegalDocuments | undefined>(() =>
    cachedLegalDocuments(language),
  );
  useEffect(() => {
    let current = true;
    setDocuments(cachedLegalDocuments(language));
    void loadLegalDocuments(language).then((loadedDocuments) => {
      if (current) setDocuments(loadedDocuments);
    });
    return () => {
      current = false;
    };
  }, [language]);
  const content = documents?.[document];
  const others = contractDocuments.includes(document)
    ? contractDocuments.filter((key) => key !== document)
    : [];

  return (
    <LegalPage id={document} title={t(`${document}.title`)}>
      {content && (
        <div className="mt-4 space-y-1 text-[0.95rem] leading-relaxed text-ink-500">
          {content.lead.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p>{content.stand}</p>
        </div>
      )}

      {language !== defaultLanguage && (
        <p
          data-testid="legal-translation-note"
          className="mt-6 rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed"
        >
          {t("legalDocs.translationNote")}{" "}
          <Link
            to={localizedPath(defaultLanguage, legalDocumentPaths[document])}
            lang={defaultLanguage}
            className={linkClass}
          >
            {t("legalDocs.germanVersion")}
          </Link>
        </p>
      )}

      {others.length > 0 && (
        <nav aria-label={t("legalDocs.related")} className="mt-6 text-sm">
          <span className="text-ink-500">{t("legalDocs.related")}: </span>
          {others.map((key, index) => (
            <span key={key}>
              {index > 0 && " · "}
              <LocalizedLink to={legalDocumentPaths[key]} className={linkClass}>
                {t(`footer.${key}`)}
              </LocalizedLink>
            </span>
          ))}
        </nav>
      )}

      {content?.preamble.map((paragraph) => (
        <p key={paragraph} className="mt-6 text-[0.95rem] leading-relaxed">
          {paragraph}
        </p>
      ))}

      {(content?.sections as Section[] | undefined)
        ?.filter((section) => isShown(section, features))
        .map((section) => (
          <LegalSection key={section.title} title={section.title}>
            <div className="space-y-3">
              {section.paragraphs.map((block, index) => (
                <LegalBlockView key={blockKey(block, index)} block={block} />
              ))}
            </div>
          </LegalSection>
        ))}
    </LegalPage>
  );
}
