import { useTranslation } from "react-i18next";
import AltegioWidget from "../components/AltegioWidget";
import Reveal from "../components/Reveal";

/**
 * Online booking. The Figma has no calendar of its own — the studio books
 * through Altegio, so the embed lives here in the Figma's section shell.
 */
export default function BookingSection() {
  const { t } = useTranslation();
  return (
    <Reveal
      as="section"
      id="booking"
      aria-labelledby="booking-title"
      className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20"
    >
      <h2 id="booking-title" className="text-center text-2xl font-bold sm:text-3xl">
        {t("booking.title")}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-[0.95rem] leading-relaxed">
        {t("booking.intro")}
      </p>
      <div className="mt-10">
        <AltegioWidget />
      </div>
    </Reveal>
  );
}
