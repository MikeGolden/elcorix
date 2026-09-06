import { useTranslation } from "react-i18next";
import { business } from "../config";
import LegalPage, { LegalSection } from "../components/LegalPage";
import { usePageMeta } from "../seo/usePageMeta";

const sectionKeys = [
  "controller",
  "hosting",
  "contactForm",
  "booking",
  "storage",
  "rights",
] as const;

export default function PrivacyPage() {
  const { t } = useTranslation();
  usePageMeta("privacy");
  const controllerDetails = {
    businessName: business.name,
    address: business.address,
    email: business.email,
    phone: business.phone,
  };
  return (
    <LegalPage id="privacy" title={t("privacy.title")} intro={t("privacy.intro")}>
      {sectionKeys.map((key) => (
        <LegalSection key={key} title={t(`privacy.sections.${key}.title`)}>
          <p>{t(`privacy.sections.${key}.body`, controllerDetails)}</p>
        </LegalSection>
      ))}
    </LegalPage>
  );
}
