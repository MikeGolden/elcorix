import { useTranslation } from "react-i18next";
import ConsultationForm from "../components/ConsultationForm";

export default function ConsultationSection() {
  const { t } = useTranslation();
  return (
    <section
      id="consultation"
      aria-labelledby="consultation-title"
      className="mx-auto max-w-[1200px] px-4 sm:px-6"
    >
      {/* The tinted card fills the same 1200px-minus-gutters column as every
          other section, so all block edges line up down the page. */}
      <div className="rounded-panel bg-surface-soft px-6 py-12 sm:px-10 sm:py-14">
        <h2
          id="consultation-title"
          className="text-center text-2xl font-bold sm:text-3xl"
        >
          {t("consultation.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[0.95rem] leading-relaxed">
          {t("consultation.intro")}
        </p>
        <div className="mt-10">
          <ConsultationForm />
        </div>
      </div>
    </section>
  );
}
