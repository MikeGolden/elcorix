import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  localizedPath,
  splitLanguagePath,
  stripForeignLanguagePrefix,
  type SupportedLanguage,
} from "../i18n/routing";
import { useCurrentLanguage } from "../i18n/useLanguage";

type LanguageOption = {
  code: SupportedLanguage;
  label: string;
};

const languageOptions: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "uk", label: "Українська" },
  { code: "ru", label: "Русский" },
];

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();
  const language = useCurrentLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  const current =
    languageOptions.find((option) => option.code === language) ??
    languageOptions.find((option) => option.code === "de")!;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Move focus into the list when it opens, starting at the current language.
  useEffect(() => {
    if (!open) return;
    const index = languageOptions.findIndex((option) => option.code === current.code);
    optionRefs.current[Math.max(index, 0)]?.focus();
  }, [open, current.code]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  /**
   * The language lives in the URL, so picking one is a navigation: the same
   * page under the other language segment, query and hash preserved.
   * `changeLanguage` runs here too rather than only in the route effect, so
   * the labels never render one frame behind the URL. Pushed, not replaced —
   * "back" should undo a language switch like any other navigation.
   */
  function select(code: SupportedLanguage) {
    const path = splitLanguagePath(pathname)?.path ?? stripForeignLanguagePrefix(pathname);
    void i18n.changeLanguage(code);
    navigate(`${localizedPath(code, path)}${search}${hash}`);
    close();
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const count = languageOptions.length;
    const focused = optionRefs.current.findIndex((el) => el === document.activeElement);
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "ArrowDown":
        event.preventDefault();
        optionRefs.current[(focused + 1) % count]?.focus();
        break;
      case "ArrowUp":
        event.preventDefault();
        optionRefs.current[(focused - 1 + count) % count]?.focus();
        break;
      case "Home":
        event.preventDefault();
        optionRefs.current[0]?.focus();
        break;
      case "End":
        event.preventDefault();
        optionRefs.current[count - 1]?.focus();
        break;
      case "Enter":
      case " ": {
        event.preventDefault();
        const option = languageOptions[focused];
        if (option) select(option.code);
        break;
      }
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        data-testid="language-switcher"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("languageSwitcher.label")}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded-full px-2 py-2 text-xs font-semibold text-brand-700 transition-colors hover:text-brand-500"
      >
        <span className="hidden sm:inline">{current.label}</span>
        <span className="sm:hidden" aria-hidden="true">
          {current.code.toUpperCase()}
        </span>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
          focusable="false"
        >
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t("languageSwitcher.label")}
          onKeyDown={onListKeyDown}
          className="absolute right-0 z-50 mt-2 min-w-40 overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-[0_18px_48px_rgba(20,32,63,0.16)]"
        >
          {languageOptions.map((option, index) => (
            <li
              key={option.code}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              role="option"
              tabIndex={-1}
              aria-selected={option.code === current.code}
              aria-current={option.code === current.code ? "true" : undefined}
              aria-label={option.label}
              onClick={() => select(option.code)}
              className="cursor-pointer px-4 py-2 text-sm text-ink-700 hover:bg-surface-soft focus:bg-surface-soft focus:outline-none"
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
