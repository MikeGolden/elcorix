import { useTranslation } from "react-i18next";
import { business } from "../config";

export default function ImprintPage() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="imprint" className="mx-auto max-w-3xl px-4 py-12">
      <h1 id="imprint" className="text-3xl font-semibold">
        {t("imprint.title")}
      </h1>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">{t("imprint.operatorTitle")}</h2>
        <p className="mt-2 leading-relaxed text-brand-700">
          {business.name}
          <br />
          {t("imprint.ownerLabel")}: {business.owner}
          <br />
          {business.address}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">{t("imprint.contactTitle")}</h2>
        <p className="mt-2 leading-relaxed text-brand-700">
          <a
            className="font-medium text-brand-600 hover:underline"
            href={`tel:${business.phone.replace(/\s/g, "")}`}
          >
            {business.phone}
          </a>
          <br />
          <a
            className="font-medium text-brand-600 hover:underline"
            href={`mailto:${business.email}`}
          >
            {business.email}
          </a>
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">{t("imprint.vatLabel")}</h2>
        <p className="mt-2 leading-relaxed text-brand-700">{business.vatId}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">{t("imprint.responsibleLabel")}</h2>
        <p className="mt-2 leading-relaxed text-brand-700">
          {business.owner}, {business.address}
        </p>
      </section>

      <p className="mt-8 text-sm leading-relaxed text-brand-700">
        {t("imprint.dispute")}
      </p>
    </section>
  );
}
