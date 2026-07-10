import { FormEvent, useState } from "react";
import { business } from "../config";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section aria-labelledby="contact" className="mx-auto max-w-5xl px-4 py-12">
      <h1 id="contact" className="text-3xl font-semibold">
        Contact
      </h1>
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-brand-700">{business.address}</p>
          <ul className="space-y-3">
            <li>
              <a
                className="font-medium text-brand-600 hover:underline"
                href={`tel:${business.phone.replace(/\s/g, "")}`}
              >
                📞 {business.phone}
              </a>
            </li>
            <li>
              <a
                className="font-medium text-brand-600 hover:underline"
                href={`mailto:${business.email}`}
              >
                ✉️ {business.email}
              </a>
            </li>
            <li>
              <a
                className="font-medium text-brand-600 hover:underline"
                href={business.instagram}
                target="_blank"
                rel="noreferrer"
              >
                📸 {business.instagramHandle}
              </a>
            </li>
          </ul>
          <p className="text-sm text-brand-700">
            Opening hours: Mon–Fri 9:00–18:00, Sat 10:00–14:00
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Contact form">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              className="mt-1 w-full rounded-lg border border-brand-100 bg-white px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-brand-100 bg-white px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className="mt-1 w-full rounded-lg border border-brand-100 bg-white px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-full bg-brand-600 px-6 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Send message"}
          </button>
          {status === "sent" && (
            <p role="status" className="text-sm text-green-700">
              Thank you! We will get back to you shortly.
            </p>
          )}
          {status === "error" && (
            <p role="alert" className="text-sm text-red-700">
              Something went wrong. Please try again or call us.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
