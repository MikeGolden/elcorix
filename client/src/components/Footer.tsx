import { business } from "../config";

export default function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-6 text-sm text-brand-700 sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()} {business.name} · {business.address}
        </p>
        <div className="flex gap-4">
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
    </footer>
  );
}
