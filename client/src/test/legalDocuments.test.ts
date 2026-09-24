import de from "../i18n/locales/de/legal.json";
import en from "../i18n/locales/en/legal.json";
import uk from "../i18n/locales/uk/legal.json";
import ru from "../i18n/locales/ru/legal.json";
import { staticBusiness } from "../business";
import { listItemText, type LegalBlock } from "../components/LegalDocument";

type Documents = typeof de;
const documentKeys = Object.keys(de) as (keyof Documents)[];

/** Every text inside a block, in order. */
function blockTexts(block: LegalBlock): string[] {
  if (typeof block === "string") return [block];
  return "list" in block ? block.list.map(listItemText) : [block.heading];
}

/** Paragraph, list (with its length) or sub-heading — the shape translations must keep. */
function blockShape(block: LegalBlock): string {
  if (typeof block === "string") return `p${block.split("\n").length}`;
  if (!("list" in block)) return "heading";
  // Gated items must be gated in every language, or a translation would
  // show a line the German text hides.
  const gates = block.list.map((item) => (typeof item === "string" ? "" : item.feature));
  return `list${block.list.length}${gates.join(",")}`;
}

/** "3.1 Die reguläre …" → "3.1", "Ein Termin …" → null. */
function clauseNumber(text: string): string | null {
  return /^(\d+(?:\.\d+)?)\.?\s/.exec(text)?.[1] ?? null;
}

describe("legal documents", () => {
  it("covers the three documents of 15.09.2026 and the privacy policy", () => {
    expect(documentKeys).toEqual([
      "terms",
      "appointmentTerms",
      "packageTerms",
      "privacy",
    ]);
    for (const key of ["terms", "appointmentTerms", "packageTerms"] as const) {
      expect(de[key].stand).toBe("Stand: 15.09.2026");
    }
    expect(de.privacy.stand).toBe("Stand: 18. September 2026");
  });

  it.each([
    ["en", en],
    ["uk", uk],
    ["ru", ru],
  ] as const)(
    "%s mirrors the German structure clause for clause",
    (_language, translated) => {
      for (const key of documentKeys) {
        const original = de[key];
        const copy = translated[key];
        expect(copy.lead, key).toHaveLength(original.lead.length);
        expect(copy.preamble, key).toHaveLength(original.preamble.length);
        expect(copy.sections, key).toHaveLength(original.sections.length);
        original.sections.forEach((section, index) => {
          const other = copy.sections[index]!;
          expect(clauseNumber(other.title), `${key} §${index + 1}`).toBe(
            clauseNumber(section.title),
          );
          expect(other.paragraphs, `${key} §${index + 1}`).toHaveLength(
            section.paragraphs.length,
          );
          expect(
            (other as { feature?: string }).feature,
            `${key} §${index + 1} feature`,
          ).toBe((section as { feature?: string }).feature);
          (section.paragraphs as LegalBlock[]).forEach((block, p) => {
            const otherBlock = (other.paragraphs as LegalBlock[])[p]!;
            const where = `${key} §${index + 1}/${p + 1}`;
            expect(blockShape(otherBlock), where).toBe(blockShape(block));
            if (typeof block === "string") {
              expect(clauseNumber(otherBlock as string), where).toBe(
                clauseNumber(block),
              );
            }
          });
        });
      }
    },
  );

  it.each([
    ["de", de],
    ["en", en],
    ["uk", uk],
    ["ru", ru],
  ] as const)("%s has no empty text", (_language, documents) => {
    for (const key of documentKeys) {
      const doc = documents[key];
      const texts = [
        ...doc.lead,
        doc.stand,
        ...doc.preamble,
        ...doc.sections.flatMap((section) => [
          section.title,
          ...(section.paragraphs as LegalBlock[]).flatMap(blockTexts),
        ]),
      ];
      for (const text of texts) expect(text.trim(), key).not.toBe("");
    }
  });

  it("names the same provider and email as the rest of the site", () => {
    // The documents spell these out in prose; if business.ts changes, the
    // legal texts must be changed with it.
    for (const documents of [de, en, uk, ru]) {
      expect(documents.terms.lead.join(" ")).toContain(staticBusiness.owner);
      expect(documents.terms.lead.join(" ")).toContain(staticBusiness.email);
      expect(
        documents.appointmentTerms.sections[1]!.paragraphs.join(" "),
      ).toContain(staticBusiness.email);
    }
  });

  describe("privacy policy", () => {
    const all = { de, en, uk, ru } as const;
    const text = (documents: Documents) =>
      documents.privacy.sections
        .flatMap((section) => [
          section.title,
          ...(section.paragraphs as LegalBlock[]).flatMap(blockTexts),
        ])
        .join(" ");
    const digits = (value: string) => value.replace(/\D/g, "");

    it.each(Object.entries(all))(
      "%s names the controller exactly as business.ts does",
      (_l, documents) => {
        const controller = (documents.privacy.sections[0]!.paragraphs as LegalBlock[])
          .flatMap(blockTexts)
          .join("\n");
        expect(controller).toContain(staticBusiness.owner);
        expect(controller).toContain(staticBusiness.email);
        expect(controller).toContain("ELCORIX");
        expect(controller).toContain("Bodmanstraße 14\n87435 Kempten (Allgäu)");
        // The policy writes the number without the grouping spaces.
        expect(digits(controller)).toContain(digits(staticBusiness.phone));
      },
    );

    it.each(Object.entries(all))(
      "%s names every recipient and storage key the site actually uses",
      (_l, documents) => {
        const body = text(documents);
        // Hetzner (server, DB, mail), components/MapEmbed.tsx, the WhatsApp
        // and Instagram links, the local-storage keys and the authority.
        for (const name of [
          "Hetzner Online GmbH",
          "OpenStreetMap Foundation",
          "Meta Platforms Ireland Limited",
          "WhatsApp Ireland Limited",
          "Telegram",
          "BayLDA",
          "i18nextLng",
          "cookie-consent",
        ]) {
          expect(body, name).toContain(name);
        }
      },
    );

    it("promises the retention periods the code enforces", () => {
      // server/src/retention.ts (MAX_RETENTION_MONTHS = 6), the db-backup
      // service (BACKUP_KEEP_DAYS = 14) and docker/prune-logs.sh (7 days).
      const body = text(de);
      expect(body).toContain("spätestens sechs Monate nach abschließender Bearbeitung");
      expect(body).toContain("spätestens nach 14 Tagen überschrieben");
      expect(body).toContain("nach spätestens sieben Tagen gelöscht");
      // docker-compose.yml → umami-retention (UMAMI_RETENTION_MONTHS = 14).
      expect(body).toContain("nach spätestens 14 Monaten automatisch gelöscht");
    });

    it.each(Object.entries(all))(
      "%s gates the Umami section behind the analytics flag, right after local storage",
      (_l, documents) => {
        const sections = documents.privacy.sections as {
          title: string;
          feature?: string;
          paragraphs: LegalBlock[];
        }[];
        const gated = sections.filter((section) => section.feature !== undefined);
        expect(gated.map((section) => section.feature)).toEqual(["analytics"]);
        expect(gated[0]!.title).toMatch(/^11\. .*Umami/);
        // Cross-references in the Umami text point at §3 and §6 only —
        // sections before it, which keep their numbers when it is hidden.
        const body = gated[0]!.paragraphs.flatMap(blockTexts).join(" ");
        expect(body).toContain("Hetzner");
        expect(body).toContain("14");
        expect(body).toMatch(/Global Privacy Control/);
      },
    );
  });
});
