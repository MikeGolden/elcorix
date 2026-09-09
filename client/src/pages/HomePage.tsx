import { features } from "../config";
import { usePageMeta } from "../seo/usePageMeta";
import Hero from "../sections/Hero";
import ForWhom from "../sections/ForWhom";
import Technology from "../sections/Technology";
import Specialist from "../sections/Specialist";
import Works from "../sections/Works";
import PriceHighlights from "../sections/PriceHighlights";
import BookingSection from "../sections/BookingSection";
import ConsultationSection from "../sections/ConsultationSection";
import ContactSection from "../sections/ContactSection";

/**
 * The one-page landing layout from the Figma. The same sections are also
 * reachable as their own routes (/prices, /gallery, /booking, /contact) —
 * they reuse these components rather than duplicating markup.
 *
 * `<BookingSection>` (the Altegio embed) is behind a feature flag and is
 * currently off — see src/features.ts.
 */
export default function HomePage() {
  usePageMeta("home");
  return (
    <>
      <Hero />
      <ForWhom />
      <Technology />
      <Specialist />
      <Works />
      <PriceHighlights />
      {features.altegio && <BookingSection />}
      <ConsultationSection />
      <ContactSection />
    </>
  );
}
