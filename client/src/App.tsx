import { Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CookieBanner from "./components/CookieBanner";
import FloatingBookCta from "./components/FloatingBookCta";
import ScrollToTop from "./components/ScrollToTop";
import LocalBusinessJsonLd from "./seo/LocalBusinessJsonLd";
import { ConsentProvider } from "./consent/ConsentContext";
import HomePage from "./pages/HomePage";
import PricesPage from "./pages/PricesPage";
import GalleryPage from "./pages/GalleryPage";
import BookingPage from "./pages/BookingPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import ImprintPage from "./pages/ImprintPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  const { t } = useTranslation();
  return (
    <ConsentProvider>
      <div className="flex min-h-screen flex-col bg-brand-50 text-brand-900">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-brand-900 focus:px-4 focus:py-2 focus:text-brand-50"
        >
          {t("nav.skipToContent")}
        </a>
        <ScrollToTop />
        <LocalBusinessJsonLd />
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
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <FloatingBookCta />
        <CookieBanner />
      </div>
    </ConsentProvider>
  );
}
