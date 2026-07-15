import { useTranslation } from "react-i18next";
import { business } from "../config";
import { usePageMeta } from "../seo/usePageMeta";

export default function ImprintPage() {
  const { t } = useTranslation();
  usePageMeta("imprint");
  return (
    <section aria-labelledby="imprint" className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <div aria-hidden="true" className="h-px w-12 bg-brand-500" />
      <h1
        id="imprint"
        className="mt-6 font-display text-4xl font-medium text-brand-900 sm:text-5xl"
      >
        {t("imprint.title")}
      </h1>

      <section className="mt-10 border-t border-brand-200 pt-8">
        <h2 className="font-display text-2xl font-medium text-brand-900">{t("imprint.operatorTitle")}</h2>
        <p className="mt-3 font-light leading-loose text-brand-700">
          {business.name}
          <br />
          {t("imprint.ownerLabel")}: {business.owner}
          <br />
          {business.address}
        </p>
      </section>

      <section className="mt-10 border-t border-brand-200 pt-8">
        <h2 className="font-display text-2xl font-medium text-brand-900">{t("imprint.contactTitle")}</h2>
        <p className="mt-3 font-light leading-loose text-brand-700">
          <a
            className="font-medium text-brand-600 underline-offset-4 hover:underline"
            href={`tel:${business.phone.replace(/\s/g, "")}`}
          >
            {business.phone}
          </a>
          <br />
          <a
            className="font-medium text-brand-600 underline-offset-4 hover:underline"
            href={`mailto:${business.email}`}
          >
            {business.email}
          </a>
        </p>
      </section>

      <section className="mt-10 border-t border-brand-200 pt-8">
        <h2 className="font-display text-2xl font-medium text-brand-900">{t("imprint.vatLabel")}</h2>
        <p className="mt-3 font-light leading-loose text-brand-700">{business.vatId}</p>
      </section>

      <section className="mt-10 border-t border-brand-200 pt-8">
        <h2 className="font-display text-2xl font-medium text-brand-900">{t("imprint.responsibleLabel")}</h2>
        <p className="mt-3 font-light leading-loose text-brand-700">
          {business.owner}, {business.address}
        </p>
      </section>

      <p className="mt-10 border-t border-brand-200 pt-8 text-sm font-light leading-loose text-brand-700">
        {t("imprint.dispute")}
      </p>
    </section>
  );
}
