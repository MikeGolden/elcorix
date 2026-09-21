import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const CONSENT_STORAGE_KEY = "cookie-consent";

export type ConsentState = {
  version: 1;
  /** ISO timestamp of the decision — kept as the consent record. */
  decidedAt: string;
  /** Third-party Altegio booking embed (sets cookies from alteg.io). */
  booking: boolean;
};

function readStoredConsent(): ConsentState | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as ConsentState).version === 1 &&
      typeof (parsed as ConsentState).booking === "boolean"
    ) {
      return parsed as ConsentState;
    }
    return null;
  } catch {
    return null;
  }
}

type ConsentContextValue = {
  consent: ConsentState | null;
  /** True while the user still has to (re-)decide — the banner is shown. */
  bannerOpen: boolean;
  /** Record a decision; `booking` grants/denies the Altegio embed. */
  decide: (booking: boolean) => void;
  /** Reopen the banner (footer “Cookie settings”) to change the decision. */
  openSettings: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [reopened, setReopened] = useState(false);
  /**
   * Whether the stored decision has been read yet. The first render must
   * not read it: the page is prerendered in Node, where there is no
   * localStorage, and React only hydrates markup its first client render
   * agrees with — a returning visitor would otherwise render "no banner"
   * over a server document that has one. So the banner stays closed until
   * the effect below has run, which is also the honest state: we do not
   * know what was decided until we have looked.
   */
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setConsent(readStoredConsent());
    setLoaded(true);
  }, []);

  const decide = useCallback((booking: boolean) => {
    const next: ConsentState = {
      version: 1,
      decidedAt: new Date().toISOString(),
      booking,
    };
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable (e.g. blocked) — consent still applies in-memory.
    }
    setConsent(next);
    setReopened(false);
  }, []);

  const openSettings = useCallback(() => setReopened(true), []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      bannerOpen: (loaded && consent === null) || reopened,
      decide,
      openSettings,
    }),
    [consent, loaded, reopened, decide, openSettings],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (context === null) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return context;
}
