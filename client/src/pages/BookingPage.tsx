import { useTranslation } from "react-i18next";
import AltegioWidget from "../components/AltegioWidget";
import BookingRequestForm from "../components/BookingRequestForm";
import { usePageMeta } from "../seo/usePageMeta";

export default function BookingPage() {
  const { t } = useTranslation();
  usePageMeta("booking");
  return (
    <section aria-labelledby="booking" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div aria-hidden="true" className="h-px w-12 bg-brand-500" />
      <h1
        id="booking"
        className="mt-6 font-display text-4xl font-medium text-brand-900 sm:text-5xl"
      >
        {t("booking.title")}
      </h1>
      <p className="mt-5 max-w-2xl font-light leading-loose text-brand-700">
        {t("booking.intro")}
      </p>
      <div className="mt-12">
        <AltegioWidget />
      </div>
      <div className="mt-12">
        <BookingRequestForm />
      </div>
    </section>
  );
}
