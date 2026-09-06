import { useTranslation } from "react-i18next";
import { business, telHref } from "../config";
import LegalPage, { LegalSection } from "../components/LegalPage";
import { usePageMeta } from "../seo/usePageMeta";

const linkClass = "font-medium text-brand-600 underline-offset-4 hover:underline";

export default function ImprintPage() {
  const { t } = useTranslation();
  usePageMeta("imprint");
  return (
    <LegalPage id="imprint" title={t("imprint.title")}>
      <LegalSection title={t("imprint.operatorTitle")}>
        <p>
          {business.name}
          <br />
          {t("imprint.ownerLabel")}: {business.owner}
          <br />
          {business.address}
        </p>
      </LegalSection>

      <LegalSection title={t("imprint.contactTitle")}>
        <p>
          <a className={linkClass} href={telHref}>
            {business.phone}
          </a>
          <br />
          <a className={linkClass} href={`mailto:${business.email}`}>
            {business.email}
          </a>
        </p>
      </LegalSection>

      <LegalSection title={t("imprint.vatLabel")}>
        <p>{business.vatId}</p>
      </LegalSection>

      <LegalSection title={t("imprint.responsibleLabel")}>
        <p>
          {business.owner}, {business.address}
        </p>
      </LegalSection>

      <p className="mt-10 border-t border-line pt-8 text-sm leading-relaxed text-ink-500">
        {t("imprint.dispute")}
      </p>
    </LegalPage>
  );
}
