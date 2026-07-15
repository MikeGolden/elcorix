import { useEffect } from "react";
import { business, altegioBookingUrl } from "../config";

const SCRIPT_ID = "local-business-jsonld";

/**
 * schema.org LocalBusiness structured data for Google's local results
 * (address, geo, opening hours, booking link). Built entirely from our
 * own config via JSON.stringify and injected as application/ld+json —
 * browsers never execute this script type.
 */
export default function LocalBusinessJsonLd() {
  useEffect(() => {
    const [street, cityLine] = business.address.split(", ");
    const [postalCode, ...cityParts] = (cityLine ?? "").split(" ");
    const data = {
      "@context": "https://schema.org",
      "@type": "BeautySalon",
      name: business.name,
      url: business.siteUrl,
      image: `${business.siteUrl}/images/hero.jpg`,
      telephone: business.phone,
      email: business.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: street,
        postalCode,
        addressLocality: cityParts.join(" "),
        addressCountry: "DE",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: business.geo.latitude,
        longitude: business.geo.longitude,
      },
      openingHoursSpecification: business.openingHours.map((slot) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: slot.days,
        opens: slot.opens,
        closes: slot.closes,
      })),
      sameAs: [business.instagram],
      potentialAction: {
        "@type": "ReserveAction",
        target: altegioBookingUrl,
      },
    };

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }, []);

  return null;
}
