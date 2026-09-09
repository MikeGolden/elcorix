/*
 * Build the theme's German and Ukrainian translation catalogues from the
 * React app's i18n JSON.
 *
 * The old front end kept every string in
 * `client/src/i18n/locales/<lng>/common.json` and looked it up by key.
 * WordPress translates by source string instead, so this script walks a
 * declared map of "the English string a template now contains" → "the JSON
 * key it came from" and writes real .po and .mo files. Running it is a
 * one-way import: after the first run the .po files are the source of
 * truth and this script is kept only as provenance — if a string is ever
 * queried, it says exactly which key it came from.
 *
 * The .mo writer is here because msgfmt is not installed in every
 * environment this repo gets built in, and the format is 20 lines.
 *
 * Usage:
 *   node tools/i18n-from-react.mjs <locales-dir> <theme-languages-dir>
 *
 * <locales-dir> is the folder holding de/common.json, en/common.json and
 * uk/common.json.
 */

import fs from "node:fs";
import path from "node:path";

const [localesDir, outDir] = process.argv.slice(2);
if (!localesDir || !outDir) {
	console.error("usage: node tools/i18n-from-react.mjs <locales-dir> <out-dir>");
	process.exit(1);
}

/** i18next placeholders → printf, and <privacyLink> → a %1$s…%2$s pair. */
const asPrintf = (value) =>
	value
		.replace(/\{\{current\}\}/g, "%1$d")
		.replace(/\{\{total\}\}/g, "%2$d")
		.replace(/\{\{name\}\}/g, "%s")
		.replace(/\{\{businessName\}\}/g, "%s")
		.replace(/<privacyLink>/g, "%1$s")
		.replace(/<\/privacyLink>/g, "%2$s");

/**
 * Every string the templates hand to __() or _x(), and the JSON key it was
 * lifted from. A context is given only where two different keys share an
 * English string but not a German one — "Privacy policy" is "Datenschutz"
 * in the footer row and "Datenschutzerklärung" everywhere else.
 */
const MAP = [
	// Header, footer, navigation
	["nav.skipToContent"],
	["nav.forWhom"],
	["nav.technology"],
	["nav.specialist"],
	["nav.work"],
	["nav.prices"],
	["nav.consultation"],
	["nav.contact"],
	["nav.label"],
	["cta.book"],
	["cta.consultation"],
	["cta.whatsapp"],
	["cta.learnMore"],
	["cta.moreDevices"],
	["cta.fullPriceList"],
	["footer.label"],
	["footer.imprint"],
	["footer.privacy", "footer link"],
	["footer.terms"],
	["footer.mission"],
	["footer.sitemap"],
	["footer.cookieSettings"],
	["languageSwitcher.label"],

	// Price tables
	["prices.groups.women"],
	["prices.groups.men"],
	["prices.groups.packages"],
	["prices.columns.package"],
	["prices.columns.zones"],
	["prices.columns.single"],
	["prices.columns.six"],
	["prices.columns.eight"],

	// Booking embed
	["booking.widgetTitle"],
	["booking.fallbackQuestion"],
	["booking.fallbackLink"],
	["booking.consentTitle"],
	["booking.consentText"],
	["booking.consentLoad"],

	// Consultation form
	["consultation.name"],
	["consultation.phone"],
	["consultation.phoneError"],
	["consultation.date"],
	["consultation.time"],
	["consultation.timeAny"],
	["consultation.dateRequired"],
	["consultation.datePast"],
	["consultation.consentMarketing"],
	["consultation.consentPrivacy"],
	["consultation.sending"],
	["consultation.success"],
	["consultation.error"],

	// Contact block and form
	["contact.addressLabel"],
	["contact.phoneLabel"],
	["contact.emailLabel"],
	["contact.hoursTitle"],
	["contact.formTitle"],
	["contact.formLabel"],
	["contact.name"],
	["contact.email"],
	["contact.message"],
	["contact.messagePlaceholder"],
	["contact.privacyConsent"],
	["contact.send"],
	["contact.success"],
	["contact.error"],
	["contact.map.title"],

	// Works slider and image viewer
	["work.prev"],
	["work.next"],
	["lightbox.label"],
	["lightbox.open"],
	["lightbox.close"],
	["lightbox.prev"],
	["lightbox.next"],
	["lightbox.counter"],

	// Consent banner
	["consent.title"],
	["consent.description"],
	["consent.privacyLink"],
	["consent.acceptAll"],
	["consent.necessaryOnly"],

	// 404
	["notFound.title"],
	["notFound.text"],
	["notFound.cta"],
];

const read = (lng) =>
	JSON.parse(fs.readFileSync(path.join(localesDir, lng, "common.json"), "utf8"));

const at = (object, key) =>
	key.split(".").reduce((node, part) => (node ?? {})[part], object);

const catalogues = { en: read("en"), de: read("de"), uk: read("uk") };

/** language slug → the file name WordPress looks for. */
const TARGETS = { de: "de_DE", uk: "uk" };

function escapePo(value) {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n");
}

/** The binary .mo format: a header, then the two string tables. */
function writeMo(entries, file) {
	const keys = entries
		.map(({ context, id, str }) => ({
			key: context === undefined ? id : `${context}${id}`,
			str,
		}))
		.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

	const originals = keys.map((entry) => Buffer.from(entry.key, "utf8"));
	const translations = keys.map((entry) => Buffer.from(entry.str, "utf8"));
	const count = keys.length;

	const headerSize = 28;
	const tableSize = count * 8;
	let offset = headerSize + tableSize * 2;

	const originalTable = Buffer.alloc(tableSize);
	originals.forEach((buffer, index) => {
		originalTable.writeUInt32LE(buffer.length, index * 8);
		originalTable.writeUInt32LE(offset, index * 8 + 4);
		offset += buffer.length + 1;
	});

	const translationTable = Buffer.alloc(tableSize);
	translations.forEach((buffer, index) => {
		translationTable.writeUInt32LE(buffer.length, index * 8);
		translationTable.writeUInt32LE(offset, index * 8 + 4);
		offset += buffer.length + 1;
	});

	const header = Buffer.alloc(headerSize);
	header.writeUInt32LE(0x950412de, 0); // magic
	header.writeUInt32LE(0, 4); // revision
	header.writeUInt32LE(count, 8);
	header.writeUInt32LE(headerSize, 12);
	header.writeUInt32LE(headerSize + tableSize, 16);
	header.writeUInt32LE(0, 20); // hash table size
	header.writeUInt32LE(offset, 24); // hash table offset

	const nul = Buffer.from([0]);
	const parts = [header, originalTable, translationTable];
	originals.forEach((buffer) => parts.push(buffer, nul));
	translations.forEach((buffer) => parts.push(buffer, nul));

	fs.writeFileSync(file, Buffer.concat(parts));
}

fs.mkdirSync(outDir, { recursive: true });

for (const [language, target] of Object.entries(TARGETS)) {
	const entries = [];
	const seen = new Set();

	// The empty msgid carries the catalogue's own metadata.
	entries.push({
		id: "",
		str: [
			"Project-Id-Version: elcorix 1.0.0",
			"Content-Type: text/plain; charset=UTF-8",
			"Content-Transfer-Encoding: 8bit",
			`Language: ${target}`,
			"Plural-Forms: nplurals=2; plural=(n != 1);",
			"X-Generator: tools/i18n-from-react.mjs",
			"",
		].join("\n"),
	});

	for (const [key, context] of MAP) {
		const source = at(catalogues.en, key);
		const translated = at(catalogues[language], key);
		if (typeof source !== "string" || typeof translated !== "string") {
			throw new Error(`missing ${key} for ${language}`);
		}

		const id = asPrintf(source);
		const str = asPrintf(translated);
		const unique = context === undefined ? id : `${context}${id}`;

		if (seen.has(unique)) {
			// Two keys with the same English text and the same context: fine
			// only if they also agree in the target language.
			const previous = entries.find(
				(entry) =>
					(entry.context === undefined ? entry.id : `${entry.context}${entry.id}`) ===
					unique
			);
			if (previous && previous.str !== str) {
				throw new Error(
					`"${id}" needs a context: ${key} translates differently from an earlier key`
				);
			}
			continue;
		}
		seen.add(unique);
		entries.push({ id, str, context, key });
	}

	const po = entries
		.map((entry) => {
			const lines = [];
			if (entry.key) lines.push(`#. from ${entry.key} in the React build`);
			if (entry.context) lines.push(`msgctxt "${escapePo(entry.context)}"`);
			lines.push(`msgid "${escapePo(entry.id)}"`);
			lines.push(`msgstr "${escapePo(entry.str)}"`);
			return lines.join("\n");
		})
		.join("\n\n");

	fs.writeFileSync(path.join(outDir, `${target}.po`), po + "\n", "utf8");
	writeMo(entries, path.join(outDir, `${target}.mo`));
	console.log(`${target}: ${entries.length - 1} strings`);
}
