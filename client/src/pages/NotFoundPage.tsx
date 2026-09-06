import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePageMeta } from "../seo/usePageMeta";

export default function NotFoundPage() {
  const { t } = useTranslation();
  usePageMeta("notFound");
  return (
    <section
      aria-labelledby="not-found"
      className="mx-auto max-w-[1200px] px-4 py-24 text-center sm:px-6 sm:py-32"
    >
      <p aria-hidden="true" className="font-display text-6xl font-extrabold text-brand-200">
        404
      </p>
      <h1 id="not-found" className="mt-6 text-3xl font-extrabold sm:text-4xl">
        {t("notFound.title")}
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed">
        {t("notFound.text")}
      </p>
      <Link to="/" className="btn-primary mt-9">
        {t("notFound.cta")}
      </Link>
    </section>
  );
}
