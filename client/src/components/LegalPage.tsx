import type { ReactNode } from "react";

/** Shared shell for the four legal pages (Impressum, Datenschutz, AGB, Leitbild). */
export default function LegalPage({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 id={id} className="text-3xl font-extrabold sm:text-4xl">
        {title}
      </h1>
      {intro !== undefined && (
        <p className="mt-6 text-[0.95rem] leading-relaxed">{intro}</p>
      )}
      {children}
    </section>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 border-t border-line pt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-3 text-[0.95rem] leading-relaxed">{children}</div>
    </section>
  );
}
