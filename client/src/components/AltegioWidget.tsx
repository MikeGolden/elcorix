import { altegioBookingUrl, business } from "../config";

/**
 * Embeds the Altegio online-booking page (calendar, services, staff)
 * for the configured company. Altegio hosts the full booking flow at
 * https://n<companyId>.alteg.io — embedding it keeps the calendar,
 * availability and confirmation logic on Altegio's side.
 */
export default function AltegioWidget() {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
      <iframe
        title="Altegio online booking"
        data-testid="altegio-widget"
        src={altegioBookingUrl}
        className="h-[720px] w-full"
        loading="lazy"
        allow="payment"
      />
      <p className="border-t border-brand-100 p-3 text-center text-sm text-brand-700">
        Booking not loading?{" "}
        <a
          className="font-medium text-brand-600 underline"
          href={altegioBookingUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open the {business.name} booking calendar in a new tab
        </a>
      </p>
    </div>
  );
}
