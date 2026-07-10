import { Link, NavLink } from "react-router-dom";
import { business } from "../config";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-brand-600 text-white"
      : "text-brand-700 hover:bg-brand-100"
  }`;

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-brand-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          {business.name}
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/booking" className={navLinkClass}>
            Book a procedure
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
