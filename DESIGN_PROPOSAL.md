# elcorix — design system

Derived from the Figma file
`https://www.figma.com/design/L3SYAnqXeHiD81Ny4cdVmF/elcorix` (desktop frame
~1600 px wide, plus a mobile frame). This document records what was taken from
that file, what had to be decided outside it, and what still needs the client's
input before launch.

## How the design was read

The Figma MCP tools could not be used: the connected Figma account
(`msg0687@gmail.com`) holds a **View** seat on a Starter plan, and
`get_metadata` / `get_design_context` / `get_screenshot` all require an edit
seat. The design was therefore read visually from the file in a browser at 50%
and 100% zoom. Colours and spacing below are matched by eye, not sampled from
the file — if an edit seat becomes available, re-run `get_variable_defs` and
reconcile the tokens in `client/src/index.css`.

## Tokens (`client/src/index.css`)

Everything is defined in the Tailwind v4 `@theme` block; there is no
`tailwind.config.js`.

| Token | Value | Used for |
| --- | --- | --- |
| `--color-brand-700` | `#26397f` | H1, primary buttons, footer band |
| `--color-brand-600` | `#2c4aa8` | Section headings, inline links |
| `--color-brand-500` | `#4460b4` | Check marks, small accents |
| `--color-brand-400` | `#6a83c9` | "Mehr erfahren →" links |
| `--color-brand-200` | `#c9d5f0` | Outline-button borders |
| `--color-ink-900` | `#14203f` | Bold copy inside paragraphs, prices |
| `--color-ink-700` | `#3d4a6b` | Table body text |
| `--color-ink-500` | `#66708c` | Default body copy |
| `--color-ink-300` | `#9aa3b8` | Muted labels, placeholders |
| `--color-line` | `#e4e8f0` | Hairlines, field borders, table rules |
| `--color-surface-soft` | `#f4f6fa` | The pale band alternating with white |
| `--radius-card` | `1rem` | Small thumbnails, form fields |
| `--radius-panel` | `1.5rem` | Photos, cards, panels, footer top |

Type: **Manrope** (600/700/800) for headings, **Inter** (400/500/600) for body.
Both are self-hosted via `@fontsource` — no Google Fonts request, which the
nginx CSP (`font-src 'self'`) enforces anyway.

Component classes: `.btn-primary`, `.btn-ghost`, `.link-more`, `.field`.
Note that Tailwind v4 cannot `@apply` a custom class, so the shared pill shape
is declared on `.btn-primary, .btn-ghost` together rather than composed from a
`.btn` base.

## Layout

One-page landing (`/`) with an anchor menu, plus deep-link routes that reuse
the same components:

| Section (`id`) | Component | Also at |
| --- | --- | --- |
| hero | `sections/Hero` | — |
| `for-whom` | `sections/ForWhom` | — |
| `technology` | `sections/Technology` | — |
| `specialist` | `sections/Specialist` | — |
| `work` | `sections/Works` | `/gallery` |
| `prices` | `sections/PriceHighlights` | `/prices` |
| `booking` | `sections/BookingSection` | `/booking` |
| `consultation` | `sections/ConsultationSection` | `/booking` |
| `contact` | `sections/ContactSection` | `/contact` |

Legal routes from the Figma footer: `/imprint`, `/privacy`, `/terms` (AGB),
`/mission` (Leitbild). The footer additionally carries the "Cookie settings"
button, which the Figma does not show but GDPR requires (consent must be as
easy to withdraw as to give).

Content max width is 1200 px; the Figma frame is ~1600 px with roughly 200 px
side margins, which is the same measure.

## Deliberate deviations from the Figma

1. **Booking.** The Figma has no calendar. Booking runs through the
   consent-gated Altegio embed (`components/AltegioWidget`), styled into the
   Figma's section shell. The Figma's own form is kept as the cookie-free
   consultation request (`components/ConsultationForm`) posting to
   `/api/bookings`.
2. **Form consent text.** The Figma's two checkboxes are boilerplate about
   signing up for a *webinar*. They were rewritten for this business: an
   optional marketing opt-in and a required privacy consent linking to
   `/privacy`.
3. **Certificate.** The Figma places a scan of a training certificate next to
   the specialist's portrait. Rather than fabricate a document, the same
   credentials are stated in a "Qualifikation" card. Swap in the real scan
   when it exists.
4. **Package table labels.** The `Paket` column in "Paketlösungen für Frauen"
   repeats single-zone names ("Oberlippe", "Kinn", …) that do not match the
   zones listed beside them — almost certainly a copy-paste artefact in the
   Figma. The strings are reproduced verbatim rather than invented around;
   **please confirm the intended package names.**
5. **Work strip.** Rendered as a scrollable, snap-aligned row instead of an
   auto-playing carousel, so visitors control what they look at.
6. **Logo.** `components/Logo` type-sets the wordmark in Manrope 800 italic as
   a stand-in for the custom elcorix logotype. Drop the real SVG in there.

## Still to confirm before launch

- Prices for men were partly cut off at the frame edge when read; verify the
  eight values in `client/src/pricing.ts` against the source.
- Weekday opening hours are `[Uhrzeit]` in the Figma; 09:00–19:00 is assumed
  in `config.ts` and the translations. Keep both in sync.
- Owner name, VAT ID, postcode (87435 assumed), Instagram handle and the
  `[Anzahl]` / `[Ausbildungen]` placeholders in the specialist copy.
- Photography: `client/public/images/` still holds the previous studio's stock
  photos, re-mapped to the new roles in `client/src/images.ts`. Replace with
  real laser-hair-removal photography at the same file names.
- AGB and Leitbild texts are drafts — have the AGB reviewed by a lawyer.
