import { useTranslation } from "react-i18next";
import Reveal from "../components/Reveal";
import { ChevronDownIcon } from "../components/icons";
import { faqSets, type FaqPage } from "../faq";

/**
 * The FAQ block. Native <details>/<summary>: keyboard and screen-reader
 * support for free, no open/closed state to hydrate, and the answers stay
 * in the prerendered HTML for crawlers even while collapsed.
 *
 * The same questions are emitted as FAQPage JSON-LD in the static head
 * (seo/staticHead.ts → faqJsonLd), from the same `faqSets` list.
 */
export default function Faq({ page }: { page: FaqPage }) {
  const { t } = useTranslation();
  const titleId = `faq-title-${page}`;
  return (
    <section
      id="faq"
      aria-labelledby={titleId}
      className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20"
    >
      <Reveal as="h2" id={titleId} className="text-center text-2xl font-bold sm:text-3xl">
        {t("faq.title")}
      </Reveal>
      <Reveal className="mx-auto mt-10 max-w-3xl divide-y divide-line border-y border-line">
        {faqSets[page].map((key) => (
          <details key={key} className="group" data-testid={`faq-${key}`}>
            <summary
              className="flex cursor-pointer list-none items-center justify-between gap-4 py-5
                text-left font-semibold text-ink-900 [&::-webkit-details-marker]:hidden"
            >
              {t(`faq.items.${key}.question`)}
              <ChevronDownIcon className="h-5 w-5 shrink-0 text-brand-600 transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-5 pr-9 text-[0.95rem] leading-relaxed">
              {t(`faq.items.${key}.answer`)}
            </p>
          </details>
        ))}
      </Reveal>
    </section>
  );
}
