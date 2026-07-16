import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageMeta } from "../seo/usePageMeta";

export default function NotFoundPage() {
  const { t } = useTranslation();
  usePageMeta("notFound");
  return (
    <section
      aria-labelledby="not-found"
      className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-32"
    >
      <p aria-hidden="true" className="font-mono text-7xl font-medium text-brand-500">
        404
      </p>
      <h1
        id="not-found"
        className="mt-6 font-display text-3xl font-bold uppercase tracking-tight text-brand-900 sm:text-5xl"
      >
        {t("notFound.title")}
      </h1>
      <p className="mx-auto mt-4 max-w-xl font-light leading-relaxed text-brand-700">
        {t("notFound.text")}
      </p>
      <Link
        to="/"
        className="mt-10 inline-block bg-brand-500 px-10 py-4 font-mono text-xs font-medium uppercase tracking-[0.18em] text-brand-50 transition-colors hover:bg-brand-600"
      >
        {t("notFound.cta")}
      </Link>
    </section>
  );
}
