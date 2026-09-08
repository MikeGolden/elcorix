import { Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CookieBanner from "./components/CookieBanner";
import ScrollToTop from "./components/ScrollToTop";
import { ConsentProvider } from "./consent/ConsentContext";
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
            <Route path="/" element={<HomePage />} />
            <Route path="/prices" element={<PricesPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/imprint" element={<ImprintPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/mission" element={<MissionPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <CookieBanner />
      </div>
    </ConsentProvider>
  );
}
