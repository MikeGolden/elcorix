import { useTranslation } from "react-i18next";
import LegalPage, { LegalSection } from "../components/LegalPage";
import { usePageMeta } from "../seo/usePageMeta";

const sectionKeys = ["safety", "honesty", "care"] as const;

/** "Leitbild" — the mission statement linked in the footer of the Figma. */
export default function MissionPage() {
  const { t } = useTranslation();
  usePageMeta("mission");
  return (
    <LegalPage id="mission" title={t("mission.title")} intro={t("mission.intro")}>
      {sectionKeys.map((key) => (
        <LegalSection key={key} title={t(`mission.sections.${key}.title`)}>
          <p>{t(`mission.sections.${key}.body`)}</p>
        </LegalSection>
      ))}
    </LegalPage>
  );
}
