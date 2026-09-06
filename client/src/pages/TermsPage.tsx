import { useTranslation } from "react-i18next";
import LegalPage, { LegalSection } from "../components/LegalPage";
import { usePageMeta } from "../seo/usePageMeta";

const sectionKeys = ["scope", "appointments", "cancellation", "payment", "liability"] as const;

/** "AGB" — the general terms linked in the footer of the Figma. */
export default function TermsPage() {
  const { t } = useTranslation();
  usePageMeta("terms");
  return (
    <LegalPage id="terms" title={t("terms.title")} intro={t("terms.intro")}>
      {sectionKeys.map((key) => (
        <LegalSection key={key} title={t(`terms.sections.${key}.title`)}>
          <p>{t(`terms.sections.${key}.body`)}</p>
        </LegalSection>
      ))}
      <p className="mt-10 border-t border-line pt-8 text-sm leading-relaxed text-ink-500">
        {t("terms.note")}
      </p>
    </LegalPage>
  );
}
