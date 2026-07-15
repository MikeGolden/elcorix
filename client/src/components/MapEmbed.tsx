import { useState } from "react";
import { useTranslation } from "react-i18next";
import { business } from "../config";

const { latitude, longitude } = business.geo;
const bbox = [longitude - 0.006, latitude - 0.003, longitude + 0.006, latitude + 0.003].join(",");
const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
const largeMapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;

/**
 * Click-to-load OpenStreetMap embed (two-click pattern, same as the
 * Altegio widget): nothing third-party loads until the visitor asks for
 * the map, so no consent record is needed — the click *is* the request.
 */
export default function MapEmbed() {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    return (
      <div
        data-testid="map-placeholder"
        className="flex aspect-[4/3] flex-col items-center justify-center border border-brand-200 bg-brand-100 p-8 text-center"
      >
        <p className="max-w-sm text-sm font-light leading-relaxed text-brand-700">
          {t("contact.map.hint")}
        </p>
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="mt-5 bg-brand-500 px-8 py-3 text-xs font-medium uppercase tracking-[0.22em] text-brand-50 transition-colors hover:bg-brand-600"
        >
          {t("contact.map.load")}
        </button>
        <a
          className="mt-4 text-sm font-medium text-brand-600 underline underline-offset-4"
          href={largeMapUrl}
          target="_blank"
          rel="noreferrer"
        >
          {t("contact.map.external")}
        </a>
      </div>
    );
  }

  return (
    <iframe
      title={t("contact.map.title")}
      data-testid="map-embed"
      src={embedUrl}
      className="aspect-[4/3] w-full border border-brand-200"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
