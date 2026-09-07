import { useTranslation } from "react-i18next";
import { business } from "../config";

const { latitude, longitude } = business.geo;
const bbox = [longitude - 0.006, latitude - 0.003, longitude + 0.006, latitude + 0.003].join(",");
const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;

/**
 * OpenStreetMap embed, loaded with the page — Mykhailo asked for the map
 * to be visible straight away, without the click-to-load placeholder.
 * The privacy policy states this: the visitor's IP reaches OpenStreetMap
 * as soon as the contact section loads.
 */
export default function MapEmbed() {
  const { t } = useTranslation();
  return (
    <iframe
      title={t("contact.map.title")}
      data-testid="map-embed"
      src={embedUrl}
      className="aspect-[4/3] h-full w-full rounded-panel border-0 md:aspect-auto md:min-h-[420px]"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
