import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { reasons } from "../content";
import { anchorHref } from "../anchors";
import { ArrowRightIcon } from "../components/icons";

export default function ForWhom() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  return (
    <section
      id="for-whom"
      aria-labelledby="for-whom-title"
      className="mx-auto max-w-[1200px] border-b border-line px-4 pb-16 sm:px-6 sm:pb-20"
    >
      <h2 id="for-whom-title" className="text-2xl font-bold sm:text-3xl">
        {t("forWhom.title")}
      </h2>
      <ul className="mt-8 grid gap-5 md:grid-cols-2">
        {reasons.map((reason) => (
          <li
            key={reason.key}
            className="flex items-center gap-5 rounded-panel bg-surface-soft p-5"
          >
            <img
              src={reason.image}
              alt=""
              loading="lazy"
              className="h-24 w-24 shrink-0 rounded-2xl object-cover sm:h-28 sm:w-28"
            />
            <div>
              <h3 className="text-[1.05rem] font-bold leading-snug text-ink-900">
                {t(`forWhom.items.${reason.key}.title` as "forWhom.items.shaving.title")}
              </h3>
              <Link
                to={anchorHref(pathname, "consultation")}
                className="link-more mt-3"
              >
                {t("cta.learnMore")}
                <ArrowRightIcon />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
