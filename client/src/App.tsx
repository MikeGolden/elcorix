import { useEffect, type ReactElement } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CookieBanner from "./components/CookieBanner";
import ScrollToTop from "./components/ScrollToTop";
import { ConsentProvider } from "./consent/ConsentContext";
import {
  detectPreferredLanguage,
  stripForeignLanguagePrefix,
  supportedLanguages,
  type SupportedLanguage,
} from "./i18n/routing";
import { publicRoutes, type MetaKey } from "./seo/routes";
import { legacyRedirects, localizedRoutePath } from "./seo/routePaths";
import { features } from "./config";
import HomePage from "./pages/HomePage";
import PricesPage from "./pages/PricesPage";
import GalleryPage from "./pages/GalleryPage";
import BookingPage from "./pages/BookingPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import ImprintPage from "./pages/ImprintPage";
import TermsPage from "./pages/TermsPage";
import AppointmentTermsPage from "./pages/AppointmentTermsPage";
import PackageTermsPage from "./pages/PackageTermsPage";
import MissionPage from "./pages/MissionPage";
import ForWhomPage from "./pages/ForWhomPage";
import NotFoundPage from "./pages/NotFoundPage";

/**
 * One element per entry in the route table. Keyed by `MetaKey` so a route
 * added to `seo/routes.ts` — the same table the sitemap and the prerendered
 * shells are built from — fails to compile until it has a page here.
 *
 * Entries for routes behind an off feature flag stay here: the page keeps
 * compiling and comes back the moment the flag is on.
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
  appointmentTerms: <AppointmentTermsPage />,
  packageTerms: <PackageTermsPage />,
  mission: <MissionPage />,
  forWhomConvenience: <ForWhomPage reason="convenience" />,
  forWhomIrritation: <ForWhomPage reason="irritation" />,
  forWhomShaving: <ForWhomPage reason="shaving" />,
  forWhomBeard: <ForWhomPage reason="beard" />,
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
 * The bare root.
 *
 * It renders the default language's home page rather than redirecting
 * straight away, and moves the visitor to their own language from an
 * effect. Two reasons, and they are the same reason: `/` is the URL every
 * inbound link and every crawler starts from, so it has to be a complete
 * page in the served HTML — a `<Navigate>` renders nothing, and nothing is
 * what a crawler that does not run JavaScript would have got. Doing the
 * redirect after mount also keeps the first client render identical to the
 * prerendered one, which is what lets React adopt the markup instead of
 * throwing it away.
 */
function RootEntry() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    const language = detectPreferredLanguage();
    void i18n.changeLanguage(language);
    navigate(localizedRoutePath(language, "/"), { replace: true });
  }, [i18n, navigate]);

  return pages.home;
}

/**
 * Everything else that is not under a language segment: old unprefixed
 * links like `/prices`, and locales the site does not have (`/fr/prices`).
 * They redirect to the visitor's language — stored choice, then browser
 * language, then German — keeping the rest of the path, the query and the
 * hash. `replace` so the redirect never lands in the back-button history.
 */
function LanguageRedirect() {
  const { pathname, search, hash } = useLocation();
  // The path that survives here is a canonical one (`/prices`), so it is
  // translated into the target language's slug in the same hop — an old
  // `/prices` link lands on `/uk/ціни`, not on `/uk/prices` and then a
  // second redirect.
  const target = localizedRoutePath(
    detectPreferredLanguage(),
    stripForeignLanguagePrefix(pathname),
  );
  return <Navigate to={`${target}${search}${hash}`} replace />;
}

export default function App() {
  const { t } = useTranslation();
  const routes = publicRoutes(features);
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
                {routes.map((route) =>
                  route.slugs[language] === "/" ? (
                    <Route key={route.metaKey} index element={pages[route.metaKey]} />
                  ) : (
                    <Route
                      key={route.metaKey}
                      path={route.slugs[language].slice(1)}
                      element={pages[route.metaKey]}
                    />
                  ),
                )}
                {/*
                  The English slugs every language used to share, and the
                  pre-rename /privacy. nginx 301s these; this is the
                  in-app safety net for a client-side navigation.
                */}
                {legacyRedirects(language, routes).map(({ from, to }) => (
                  <Route key={`legacy:${from}`} path={from} element={<Navigate to={to} replace />} />
                ))}
                <Route path="*" element={pages.notFound} />
              </Route>
            ))}
            <Route path="/" element={<RootEntry />} />
            <Route path="*" element={<LanguageRedirect />} />
          </Routes>
        </main>
        <Footer />
        <CookieBanner />
      </div>
    </ConsentProvider>
  );
}
