import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { business } from "../config";
import { useConsent } from "../consent/ConsentContext";

export default function Footer() {
  const { t } = useTranslation();
  const { openSettings } = useConsent();
  return (
    <footer className="border-t border-brand-100 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-6 text-sm text-brand-700 sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()} {business.name} · {business.address}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a className="hover:text-brand-600" href={`tel:${business.phone.replace(/\s/g, "")}`}>
            {business.phone}
          </a>
          <a className="hover:text-brand-600" href={`mailto:${business.email}`}>
            {business.email}
          </a>
          <a
            className="hover:text-brand-600"
            href={business.instagram}
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-4 border-t border-brand-100 px-4 py-3 text-sm text-brand-700 sm:justify-start">
        <Link className="hover:text-brand-600" to="/privacy">
          {t("footer.privacy")}
        </Link>
        <Link className="hover:text-brand-600" to="/imprint">
          {t("footer.imprint")}
        </Link>
        <button
          type="button"
          onClick={openSettings}
          className="hover:text-brand-600"
        >
          {t("footer.cookieSettings")}
        </button>
      </div>
    </footer>
  );
}
