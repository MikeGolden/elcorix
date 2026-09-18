import { useTranslation } from "react-i18next";
import { business, telHref } from "../config";
import LegalPage, { LegalSection } from "../components/LegalPage";
import { usePageMeta } from "../seo/usePageMeta";

const linkClass = "font-medium text-brand-600 underline-offset-4 hover:underline";

/**
 * "Impressum" — follows the studio's text of 16.09.2026 (§ 5 DDG): the
 * owner trading as ELCORIX, address, phone, e-mail and the consumer dispute
 * resolution statement. The labels are translated; the data comes from
 * business.ts so it cannot drift from the rest of the site.
 */
export default function ImprintPage() {
  const { t } = useTranslation();
  usePageMeta("imprint");
  // "Bodmanstraße 14, 87435 Kempten (Allgäu), Germany" → street, town.
  const [street, town] = business.address.split(", ");
  return (
    <LegalPage id="imprint" title={t("imprint.title")}>
      <LegalSection title={t("imprint.operatorTitle")}>
        <p>
          {business.owner}
          <br />
          {t("imprint.tradingAs")}
          <br />
          {street}
          <br />
          {town}
          <br />
          {t("imprint.country")}
        </p>
      </LegalSection>

      <LegalSection title={t("imprint.contactTitle")}>
        <p>
          {t("imprint.phoneLabel")}:{" "}
          <a className={linkClass} href={telHref}>
            {business.phone}
          </a>
          <br />
          {t("imprint.emailLabel")}:{" "}
          <a className={linkClass} href={`mailto:${business.email}`}>
            {business.email}
          </a>
        </p>
      </LegalSection>

      <LegalSection title={t("imprint.disputeTitle")}>
        <p>{t("imprint.dispute")}</p>
      </LegalSection>

      <p className="mt-10 border-t border-line pt-8 text-sm text-ink-500">
        {t("imprint.stand")}
      </p>
    </LegalPage>
  );
}
