# Prompt: add i18n (EN / DE / UK) with flag-icon language switcher

Use this prompt with a coding agent working in this repository:

---

Add full internationalization to this project (React 18 + TypeScript + Vite +
Tailwind v4 monorepo; see README.md). Support three languages: **English (en)**,
**German (de)** and **Ukrainian (uk)**. German is the default language (the
business is in Füssen, Germany); fall back to English for missing keys.

**Library & setup**
- Use `react-i18next` + `i18next` + `i18next-browser-languagedetector` in
  `client/`. No backend changes.
- Store translations as JSON per language: `client/src/i18n/locales/{en,de,uk}/common.json`.
  Initialize i18n in `client/src/i18n/index.ts` and import it in `main.tsx`.
- Detection order: localStorage (`i18nextLng`) → browser language → `de`.
  Persist the user's choice.
- Set `document.documentElement.lang` reactively on language change
  (`<html lang="de|en|uk">`).

**What to translate**
Every user-visible string currently hardcoded in `client/src`:
Header nav (Home / Book a procedure / Contact), hero tagline and CTAs,
"Who we are" and "What we do" sections including the 6 service cards
(move service titles/descriptions into translation files, keyed
`services.facial.title` etc.), booking page heading and intro, Altegio
widget fallback text, contact page (headings, form labels, placeholder,
button, success/error messages, opening hours), footer. Do NOT translate:
business name "Kosmetic Füssen", address, phone, e-mail, Instagram handle
(they stay in `config.ts`).

**Language switcher with flag icons**
- Add a `LanguageSwitcher` component in the Header (visible on mobile too).
- Each option shows a country-flag icon + label: 🇬🇧 English, 🇩🇪 Deutsch,
  🇺🇦 Українська. Implement flags as small inline SVG components
  (`client/src/components/flags/`) — do NOT rely on emoji (inconsistent on
  Windows) and do NOT add a heavy flag library.
- Accessible: a `<button aria-haspopup="listbox">` with dropdown, or three
  toggle buttons in a group; current language marked with
  `aria-current="true"`; each option has an aria-label with the language
  name; flags themselves are `aria-hidden="true"` (decorative).
- Keyboard navigable and closes on Escape/outside click if a dropdown.

**Tests (must pass)**
- Update existing unit tests to work with i18n (wrap renders with
  `I18nextProvider` or init a test i18n instance with `en` resources;
  keep existing assertions passing in English).
- New unit tests: switching language updates nav labels and persists to
  localStorage mock; default/fallback behavior; `html lang` attribute
  updates; LanguageSwitcher renders all three options with flags.
- New Playwright e2e: `e2e/i18n.spec.ts` — load `/`, switch to Deutsch,
  assert German headings ("Wer wir sind", "Was wir tun"); switch to
  Українська, assert Ukrainian headings ("Хто ми", "Що ми робимо");
  reload and assert the choice persisted.
- Translation completeness check: a unit test that asserts `de` and `uk`
  JSON files contain exactly the same key set as `en`.

**Quality bar**
- Real, natural translations (write them yourself, native-quality tone for
  a beauty salon; German uses "Sie" form), not machine-literal placeholders.
- Strict TypeScript: type-safe translation keys (augment
  `i18next` `CustomTypeOptions` with the `common` namespace resources).
- No layout breakage with longer German/Ukrainian strings (check buttons
  and nav on mobile widths).
- Update README.md (i18n section: how to add a language/key).
- Definition of done: `npm run typecheck && npm test` and
  `npm run test:e2e` pass; commit with a clear message.

---
