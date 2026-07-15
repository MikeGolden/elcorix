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
    <section aria-labelledby="privacy" className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <div aria-hidden="true" className="h-px w-12 bg-brand-500" />
      <h1
        id="privacy"
        className="mt-6 font-display text-4xl font-medium text-brand-900 sm:text-5xl"
      >
        {t("privacy.title")}
      </h1>
      <p className="mt-6 font-light leading-loose text-brand-700">{t("privacy.intro")}</p>
      {sectionKeys.map((key) => (
        <section key={key} className="mt-10 border-t border-brand-200 pt-8">
          <h2 className="font-display text-2xl font-medium text-brand-900">
            {t(`privacy.sections.${key}.title`)}
          </h2>
          <p className="mt-3 font-light leading-loose text-brand-700">
            {t(`privacy.sections.${key}.body`, controllerDetails)}
          </p>
        </section>
      ))}
    </section>
  );
}
