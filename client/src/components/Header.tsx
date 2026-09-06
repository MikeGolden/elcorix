import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { business, telHref } from "../config";
import { navAnchors } from "../content";
import { anchorHref } from "../anchors";
import LanguageSwitcher from "./LanguageSwitcher";
import Logo from "./Logo";
import { CloseIcon, MenuIcon, WhatsAppIcon } from "./icons";

const roundButton =
  "flex h-11 w-11 items-center justify-center rounded-full transition-colors";

export default function Header() {
  const { t } = useTranslation();
  const { pathname, hash } = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close the anchor menu on navigation (including hash-only jumps).
  useEffect(() => setOpen(false), [pathname, hash]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-4 sm:px-6">
        <Logo />
        <a
          href={telHref}
          className="hidden text-sm font-medium text-brand-700 transition-colors hover:text-brand-500 md:inline"
        >
          {business.phone}
        </a>

        <div ref={menuRef} className="relative ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <Link
            to={anchorHref(pathname, "consultation")}
            className="btn-primary hidden px-6 py-3 text-sm sm:inline-flex"
          >
            {t("cta.consultation")}
          </Link>
          <a
            href={business.whatsapp}
            target="_blank"
            rel="noreferrer"
            aria-label={t("cta.whatsapp")}
            className={`${roundButton} border border-brand-200 text-brand-700 hover:border-brand-400 hover:bg-brand-50`}
          >
            <WhatsAppIcon />
          </a>
          <button
            ref={toggleRef}
            type="button"
            data-testid="menu-toggle"
            aria-expanded={open}
            aria-controls="anchor-menu"
            aria-label={t("nav.label")}
            onClick={() => setOpen((value) => !value)}
            className={`${roundButton} bg-brand-700 text-white hover:bg-brand-800`}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>

          {open && (
            <nav
              id="anchor-menu"
              aria-label={t("nav.label")}
              className="absolute right-0 top-14 w-64 rounded-panel border border-line bg-white p-3 shadow-[0_18px_48px_rgba(20,32,63,0.14)]"
            >
              <ul className="space-y-1">
                {navAnchors.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={anchorHref(pathname, item.id)}
                      className="block rounded-xl px-4 py-2.5 text-[0.95rem] font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                ))}
                <li className="pt-1 sm:hidden">
                  <Link
                    to={anchorHref(pathname, "consultation")}
                    className="btn-primary w-full"
                  >
                    {t("cta.consultation")}
                  </Link>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
