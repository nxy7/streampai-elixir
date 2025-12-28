/**
 * i18n Key Validation Test
 *
 * This test ensures all locale files have the same keys as the English (source) file.
 * Missing keys in any language will cause TypeScript errors at runtime.
 *
 * For AI-driven development: Run this test after modifying any locale file to catch
 * missing translations before they reach production.
 */

import { describe, expect, it } from "vitest";
import { dict as de } from "./de";
import { dict as en } from "./en";
import { dict as es } from "./es";
import { dict as pl } from "./pl";

type NestedObject = { [key: string]: string | NestedObject };

/**
 * Recursively extracts all keys from a nested object using dot notation.
 * Example: { nav: { home: "Home" } } -> ["nav.home"]
 */
function getAllKeys(obj: NestedObject, prefix = ""): string[] {
	const keys: string[] = [];
	for (const key in obj) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		if (typeof obj[key] === "object" && obj[key] !== null) {
			keys.push(...getAllKeys(obj[key] as NestedObject, fullKey));
		} else {
			keys.push(fullKey);
		}
	}
	return keys.sort();
}

describe("i18n Localization Keys", () => {
	const englishKeys = getAllKeys(en);

	it("should have English (en) as the source with keys", () => {
		expect(englishKeys.length).toBeGreaterThan(0);
	});

	it("German (de) should have all English keys", () => {
		const germanKeys = getAllKeys(de);
		const missingInGerman = englishKeys.filter(
			(key) => !germanKeys.includes(key),
		);
		const extraInGerman = germanKeys.filter(
			(key) => !englishKeys.includes(key),
		);

		if (missingInGerman.length > 0) {
			console.error("Missing in German:", missingInGerman);
		}
		if (extraInGerman.length > 0) {
			console.warn("Extra in German (not in English):", extraInGerman);
		}

		expect(missingInGerman).toEqual([]);
	});

	it("Polish (pl) should have all English keys", () => {
		const polishKeys = getAllKeys(pl);
		const missingInPolish = englishKeys.filter(
			(key) => !polishKeys.includes(key),
		);
		const extraInPolish = polishKeys.filter(
			(key) => !englishKeys.includes(key),
		);

		if (missingInPolish.length > 0) {
			console.error("Missing in Polish:", missingInPolish);
		}
		if (extraInPolish.length > 0) {
			console.warn("Extra in Polish (not in English):", extraInPolish);
		}

		expect(missingInPolish).toEqual([]);
	});

	it("Spanish (es) should have all English keys", () => {
		const spanishKeys = getAllKeys(es);
		const missingInSpanish = englishKeys.filter(
			(key) => !spanishKeys.includes(key),
		);
		const extraInSpanish = spanishKeys.filter(
			(key) => !englishKeys.includes(key),
		);

		if (missingInSpanish.length > 0) {
			console.error("Missing in Spanish:", missingInSpanish);
		}
		if (extraInSpanish.length > 0) {
			console.warn("Extra in Spanish (not in English):", extraInSpanish);
		}

		expect(missingInSpanish).toEqual([]);
	});

	it("all locales should have identical key structures", () => {
		const germanKeys = getAllKeys(de);
		const polishKeys = getAllKeys(pl);
		const spanishKeys = getAllKeys(es);

		// Compare all against English
		expect(germanKeys).toEqual(englishKeys);
		expect(polishKeys).toEqual(englishKeys);
		expect(spanishKeys).toEqual(englishKeys);
	});
});
