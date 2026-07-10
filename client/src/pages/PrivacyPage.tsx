import { useTranslation } from "react-i18next";
import { business } from "../config";

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
  const controllerDetails = {
    businessName: business.name,
    address: business.address,
    email: business.email,
    phone: business.phone,
  };
  return (
    <section aria-labelledby="privacy" className="mx-auto max-w-3xl px-4 py-12">
      <h1 id="privacy" className="text-3xl font-semibold">
        {t("privacy.title")}
      </h1>
      <p className="mt-4 leading-relaxed text-brand-700">{t("privacy.intro")}</p>
      {sectionKeys.map((key) => (
        <section key={key} className="mt-8">
          <h2 className="text-xl font-semibold">
            {t(`privacy.sections.${key}.title`)}
          </h2>
          <p className="mt-2 leading-relaxed text-brand-700">
            {t(`privacy.sections.${key}.body`, controllerDetails)}
          </p>
        </section>
      ))}
    </section>
  );
}
