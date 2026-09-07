import { useTranslation } from "react-i18next";
import { business, telHref } from "../config";
import MapEmbed from "../components/MapEmbed";

export default function ContactSection() {
  const { t } = useTranslation();
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <MapEmbed />
        <div>
          <h2 id="contact-title" className="text-2xl font-bold sm:text-[1.9rem]">
            {t("contact.title")}
          </h2>
          <p className="mt-5 text-[0.95rem] leading-relaxed">{t("contact.intro")}</p>

          <dl className="mt-7 space-y-2 text-[0.95rem]">
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-semibold text-ink-900">{t("contact.addressLabel")}:</dt>
              <dd>{business.addressShort}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-semibold text-ink-900">{t("contact.phoneLabel")}:</dt>
              <dd>
                <a className="text-brand-600 hover:underline" href={telHref}>
                  {business.phone}
                </a>
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-semibold text-ink-900">{t("contact.emailLabel")}:</dt>
              <dd>
                <a className="text-brand-600 hover:underline" href={`mailto:${business.email}`}>
                  {business.email}
                </a>
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-semibold text-ink-900">Instagram:</dt>
              <dd>
                <a
                  className="text-brand-600 hover:underline"
                  href={business.instagram}
                  target="_blank"
                  rel="noreferrer"
                >
                  {business.instagramHandle}
                </a>
              </dd>
            </div>
          </dl>

          <h3 className="mt-9 text-xl font-bold">{t("contact.hoursTitle")}</h3>
          <ul className="mt-4 space-y-1.5 text-sm">
            <li>
              <span className="font-semibold text-ink-900">{t("contact.hours.weekdaysLabel")}:</span>{" "}
              {t("contact.hours.weekdays")}
            </li>
            <li>
              <span className="font-semibold text-ink-900">{t("contact.hours.saturdayLabel")}:</span>{" "}
              {t("contact.hours.saturday")}
            </li>
            <li>
              <span className="font-semibold text-ink-900">{t("contact.hours.sundayLabel")}:</span>{" "}
              {t("contact.hours.sunday")}
            </li>
          </ul>

          <a
            href={business.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="btn-primary mt-8"
          >
            {t("contact.whatsapp")}
          </a>
        </div>
      </div>
    </section>
  );
}
