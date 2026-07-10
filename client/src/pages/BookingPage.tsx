import AltegioWidget from "../components/AltegioWidget";

export default function BookingPage() {
  return (
    <section aria-labelledby="booking" className="mx-auto max-w-5xl px-4 py-12">
      <h1 id="booking" className="text-3xl font-semibold">
        Book a procedure
      </h1>
      <p className="mt-3 max-w-2xl text-brand-700">
        Pick a service, choose your specialist and select a free slot in the
        calendar below. You will receive a confirmation by e-mail or SMS.
      </p>
      <div className="mt-8">
        <AltegioWidget />
      </div>
    </section>
  );
}
