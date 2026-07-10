import { useTranslation } from "react-i18next";
import { altegioBookingUrl, business } from "../config";

/**
 * Embeds the Altegio online-booking page (calendar, services, staff)
 * for the configured company. Altegio hosts the full booking flow at
 * https://n<companyId>.alteg.io — embedding it keeps the calendar,
 * availability and confirmation logic on Altegio's side.
 */
export default function AltegioWidget() {
  const { t } = useTranslation();
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
      <iframe
        title={t("booking.widgetTitle")}
        data-testid="altegio-widget"
        src={altegioBookingUrl}
        className="h-[720px] w-full"
        loading="lazy"
        allow="payment"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <p className="border-t border-brand-100 p-3 text-center text-sm text-brand-700">
        {t("booking.fallbackQuestion")}{" "}
        <a
          className="font-medium text-brand-600 underline"
          href={altegioBookingUrl}
          target="_blank"
          rel="noreferrer"
        >
          {t("booking.fallbackLink", { businessName: business.name })}
        </a>
      </p>
    </div>
  );
}
