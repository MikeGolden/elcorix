import { useTranslation } from "react-i18next";
import AltegioWidget from "../components/AltegioWidget";

export default function BookingPage() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="booking" className="mx-auto max-w-5xl px-4 py-12">
      <h1 id="booking" className="text-3xl font-semibold">
        {t("booking.title")}
      </h1>
      <p className="mt-3 max-w-2xl text-brand-700">{t("booking.intro")}</p>
      <div className="mt-8">
        <AltegioWidget />
      </div>
    </section>
  );
}
