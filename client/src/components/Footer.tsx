import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { business } from "../config";
import { useConsent } from "../consent/ConsentContext";

export default function Footer() {
  const { t } = useTranslation();
  const { openSettings } = useConsent();
  return (
    <footer className="border-t border-brand-200 bg-brand-100 text-brand-700">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="font-display text-xl font-bold uppercase tracking-[0.2em] text-brand-900">
          {business.name}
          <span aria-hidden="true" className="text-brand-500">
            .
          </span>
        </p>
        <div className="mt-8 flex flex-col gap-3 text-sm font-light sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-brand-300">
            © {new Date().getFullYear()} {business.name} · {business.address}
          </p>
          <div className="flex flex-wrap gap-6">
            <a
              className="font-mono text-xs uppercase tracking-[0.15em] transition-colors hover:text-brand-500"
              href={`tel:${business.phone.replace(/\s/g, "")}`}
            >
              {business.phone}
            </a>
            <a
              className="font-mono text-xs uppercase tracking-[0.15em] transition-colors hover:text-brand-500"
              href={`mailto:${business.email}`}
            >
              {business.email}
            </a>
            <a
              className="font-mono text-xs uppercase tracking-[0.15em] transition-colors hover:text-brand-500"
              href={business.instagram}
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
            <a
              className="font-mono text-xs uppercase tracking-[0.15em] transition-colors hover:text-brand-500"
              href={business.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-brand-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-4 py-4 font-mono text-xs font-light uppercase tracking-[0.15em] text-brand-300 sm:justify-start sm:px-6">
          <Link className="transition-colors hover:text-brand-500" to="/privacy">
            {t("footer.privacy")}
          </Link>
          <Link className="transition-colors hover:text-brand-500" to="/imprint">
            {t("footer.imprint")}
          </Link>
          <button
            type="button"
            onClick={openSettings}
            className="uppercase tracking-[0.15em] transition-colors hover:text-brand-500"
          >
            {t("footer.cookieSettings")}
          </button>
        </div>
      </div>
    </footer>
  );
}
