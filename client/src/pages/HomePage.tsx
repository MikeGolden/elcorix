import { Link } from "react-router-dom";
import { business } from "../config";

const services = [
  {
    title: "Facial treatments",
    description:
      "Deep cleansing, hydrating and anti-aging facials tailored to your skin type.",
  },
  {
    title: "Permanent make-up",
    description:
      "Natural-looking brows, lips and eyeliner with gentle, precise pigmentation.",
  },
  {
    title: "Laser & apparative cosmetics",
    description:
      "Modern apparative treatments for skin rejuvenation and hair removal.",
  },
  {
    title: "Manicure & pedicure",
    description:
      "Classic and medical nail care with long-lasting gel finishes.",
  },
  {
    title: "Lash & brow styling",
    description:
      "Lifting, lamination, tinting and extensions for an effortless everyday look.",
  },
  {
    title: "Body treatments",
    description:
      "Relaxing massages, peelings and firming treatments for skin and body.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-100 to-brand-50">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {business.name}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-700">
            {business.tagline}
          </p>
          <Link
            to="/booking"
            className="mt-8 inline-block rounded-full bg-brand-600 px-8 py-3 font-medium text-white shadow hover:bg-brand-700"
          >
            Book a procedure
          </Link>
        </div>
      </section>

      {/* Who we are */}
      <section aria-labelledby="who-we-are" className="mx-auto max-w-5xl px-4 py-16">
        <h2 id="who-we-are" className="text-3xl font-semibold">
          Who we are
        </h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <p className="leading-relaxed text-brand-700">
            We are a small cosmetic procedures cabinet in the old town of
            Füssen, at the foot of the Alps. Our certified estheticians combine
            years of experience with ongoing training in modern cosmetic
            techniques.
          </p>
          <p className="leading-relaxed text-brand-700">
            We believe in honest advice, medical-grade hygiene and treatments
            that respect your skin. Every visit starts with a personal
            consultation — no upselling, just what your skin actually needs.
          </p>
        </div>
      </section>

      {/* What we do */}
      <section aria-labelledby="what-we-do" className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 id="what-we-do" className="text-3xl font-semibold">
            What we do
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li
                key={service.title}
                className="rounded-2xl border border-brand-100 bg-brand-50 p-6"
              >
                <h3 className="font-semibold">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-700">
                  {service.description}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <Link
              to="/booking"
              className="inline-block rounded-full border border-brand-600 px-8 py-3 font-medium text-brand-600 hover:bg-brand-100"
            >
              See available times
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
