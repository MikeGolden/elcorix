import LegalDocument from "../components/LegalDocument";

/**
 * "Datenschutzerklärung" — the studio's text, Stand 17.09.2026, paragraph
 * for paragraph in `locales/de/legal.json` under `privacy`. EN/UK/RU are
 * courtesy translations. It describes what the code does — Telegram gets
 * no request data, requests are kept ≤ 6 months, logs ≤ 7 days — so if an
 * integration changes, change the policy with it.
 */
export default function PrivacyPage() {
  return <LegalDocument document="privacy" />;
}
