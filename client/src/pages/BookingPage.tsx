import { useTranslation } from "react-i18next";
import AltegioWidget from "../components/AltegioWidget";
import ConsultationForm from "../components/ConsultationForm";
import { usePageMeta } from "../seo/usePageMeta";

export default function BookingPage() {
  const { t } = useTranslation();
  usePageMeta("booking");
  return (
    <section
      aria-labelledby="booking-page-title"
      className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-20"
    >
      <h1 id="booking-page-title" className="text-3xl font-extrabold sm:text-4xl">
        {t("booking.title")}
      </h1>
      <p className="mt-5 max-w-2xl text-[0.95rem] leading-relaxed">{t("booking.intro")}</p>
      <div className="mt-10">
        <AltegioWidget />
      </div>

      <div className="mt-14 rounded-panel bg-surface-soft px-6 py-12 sm:px-10">
        <h2 className="text-center text-2xl font-bold">{t("consultation.title")}</h2>
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
