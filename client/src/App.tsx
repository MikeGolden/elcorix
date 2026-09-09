import { useEffect, type ReactElement } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CookieBanner from "./components/CookieBanner";
import ScrollToTop from "./components/ScrollToTop";
import { ConsentProvider } from "./consent/ConsentContext";
import {
  detectPreferredLanguage,
  localizedPath,
  stripForeignLanguagePrefix,
  supportedLanguages,
  type SupportedLanguage,
} from "./i18n/routing";
import { siteRoutes, type MetaKey } from "./seo/routes";
import HomePage from "./pages/HomePage";
import PricesPage from "./pages/PricesPage";
import GalleryPage from "./pages/GalleryPage";
import BookingPage from "./pages/BookingPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import ImprintPage from "./pages/ImprintPage";
import TermsPage from "./pages/TermsPage";
import MissionPage from "./pages/MissionPage";
import NotFoundPage from "./pages/NotFoundPage";

/**
 * One element per entry in the route table. Keyed by `MetaKey` so a route
 * added to `seo/routes.ts` — the same table the prerendered shells are
 * built from — fails to compile until it has a page here.
 */
const pages: Record<MetaKey, ReactElement> = {
  home: <HomePage />,
  prices: <PricesPage />,
  gallery: <GalleryPage />,
  booking: <BookingPage />,
  contact: <ContactPage />,
  privacy: <PrivacyPage />,
  imprint: <ImprintPage />,
  terms: <TermsPage />,
  mission: <MissionPage />,
  notFound: <NotFoundPage />,
};

/**
 * Applies the language segment the router matched. The URL is the single
 * source of truth for the active language, so this covers everything the
 * switcher does not: a shared `/uk/prices` link, a bookmark, the back
 * button, and the redirect below.
 */
function LanguageLayout({ language }: { language: SupportedLanguage }) {
  const { i18n } = useTranslation();
  useEffect(() => {
    if (i18n.resolvedLanguage !== language) void i18n.changeLanguage(language);
  }, [i18n, language]);
  return <Outlet />;
}

/**
 * Everything that is not under a language segment: `/`, old unprefixed
 * links like `/prices`, and locales the site does not have (`/fr/prices`).
 * They redirect to the visitor's language — stored choice, then browser
 * language, then German — keeping the rest of the path, the query and the
 * hash. `replace` so the redirect never lands in the back-button history.
 */
function LanguageRedirect() {
  const { pathname, search, hash } = useLocation();
  const target = localizedPath(
    detectPreferredLanguage(),
    stripForeignLanguagePrefix(pathname),
  );
  return <Navigate to={`${target}${search}${hash}`} replace />;
}

export default function App() {
  const { t } = useTranslation();
  return (
    <ConsentProvider>
      <div className="flex min-h-screen flex-col bg-surface text-ink-500">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand-700 focus:px-5 focus:py-2 focus:text-white"
        >
          {t("nav.skipToContent")}
        </a>
        <ScrollToTop />
        <Header />
        <main id="main" className="flex-1">
          <Routes>
            {supportedLanguages.map((language) => (
              <Route
                key={language}
                path={`/${language}`}
                element={<LanguageLayout language={language} />}
              >
                {siteRoutes.map((route) =>
                  route.path === "/" ? (
                    <Route key={route.metaKey} index element={pages[route.metaKey]} />
                  ) : (
                    <Route
                      key={route.metaKey}
                      path={route.path.slice(1)}
                      element={pages[route.metaKey]}
                    />
                  ),
                )}
                <Route path="*" element={pages.notFound} />
              </Route>
            ))}
            <Route path="*" element={<LanguageRedirect />} />
          </Routes>
        </main>
        <Footer />
        <CookieBanner />
      </div>
    </ConsentProvider>
  );
}
