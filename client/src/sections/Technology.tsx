import { useState } from "react";
import { useTranslation } from "react-i18next";
import Reveal from "../components/Reveal";
import Photo from "../components/Photo";
import { ChevronDownIcon } from "../components/icons";
import { images } from "../images";

const PANEL_ID = "technology-more";

/** The bullet lists of the write-up — arrays in the locale files. */
type ListKey =
  | "technology.more.laser.checks"
  | "technology.more.ipl.checks"
  | "technology.more.facts.sessions"
  | "technology.more.facts.explain";

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-brand-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const card = "rounded-panel bg-white p-6 shadow-[0_1px_3px_rgba(20,32,63,0.06)] sm:p-8";
const cardTitle = "font-display text-lg font-bold leading-snug text-brand-700";

/**
 * The short pitch is always visible; the full write-up about the diode laser
 * and IPL opens below the section on demand.
 *
 * The panel is prerendered (collapsed with the `hidden` utility) so crawlers
 * read it, and it starts closed on both server and client so hydration
 * matches. Without JavaScript the <noscript> rule in index.html shows it and
 * hides the toggle.
 */
export default function Technology() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const list = (key: ListKey): string[] => t(key, { returnObjects: true });

  return (
    <section
      id="technology"
      aria-labelledby="technology-title"
      className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
        {/* The reveal sits on a wrapper rather than on the <img> itself:
            <Photo> renders a <picture>, and `as="img"` cannot carry one. */}
        <Reveal>
          <Photo
            src={images.technology}
            alt={t("technology.imageAlt")}
            width="1200"
            height="900"
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full rounded-panel object-cover"
          />
        </Reveal>
        <Reveal delay={110}>
          <h2 id="technology-title" className="text-2xl font-bold sm:text-[1.9rem] sm:leading-tight">
            {t("technology.title")}
          </h2>
          <div className="mt-6 space-y-4 text-[0.95rem] leading-relaxed">
            <p>{t("technology.lead")}</p>
            <p className="font-semibold text-ink-900">{t("technology.consultationFirst")}</p>
          </div>
          <button
            type="button"
            data-js-only
            data-testid="technology-toggle"
            aria-expanded={open}
            aria-controls={PANEL_ID}
            onClick={() => setOpen((value) => !value)}
            className="btn-primary mt-8"
          >
            {open ? t("technology.more.hide") : t("technology.more.show")}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </Reveal>
      </div>

      <div
        id={PANEL_ID}
        role="region"
        aria-labelledby="technology-more-title"
        className={`${open ? "" : "hidden "}mt-12 rounded-panel bg-surface-soft px-6 py-10 text-[0.95rem] leading-relaxed sm:px-10 sm:py-12`}
      >
        <h3 id="technology-more-title" className="text-xl font-bold sm:text-2xl">
          {t("technology.more.title")}
        </h3>
        <p className="mt-4 max-w-3xl">{t("technology.more.intro")}</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className={card}>
            <h4 className={cardTitle}>{t("technology.more.laser.title")}</h4>
            <p className="mt-4">{t("technology.more.laser.p1")}</p>
            <p className="mt-4">{t("technology.more.laser.checksIntro")}</p>
            <BulletList items={list("technology.more.laser.checks")} />
            <p className="mt-4">{t("technology.more.laser.p2")}</p>
            <p className="mt-4">{t("technology.more.laser.p3")}</p>
            <p className="mt-4">{t("technology.more.laser.p4")}</p>
          </div>
          <div className={card}>
            <h4 className={cardTitle}>{t("technology.more.ipl.title")}</h4>
            <p className="mt-4">{t("technology.more.ipl.p1")}</p>
            <p className="mt-4">{t("technology.more.ipl.checksIntro")}</p>
            <BulletList items={list("technology.more.ipl.checks")} />
            <p className="mt-4">{t("technology.more.ipl.p2")}</p>
          </div>
        </div>

        <div className={`${card} mt-6`}>
          <h4 className={cardTitle}>{t("technology.more.facts.title")}</h4>
          <p className="mt-4">{t("technology.more.facts.p1")}</p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p>{t("technology.more.facts.sessionsIntro")}</p>
              <BulletList items={list("technology.more.facts.sessions")} />
            </div>
            <div>
              <p>{t("technology.more.facts.explainIntro")}</p>
              <BulletList items={list("technology.more.facts.explain")} />
            </div>
          </div>
        </div>

        <p className="mt-6 text-sm text-ink-500">{t("technology.more.disclaimer")}</p>
      </div>
    </section>
  );
}
