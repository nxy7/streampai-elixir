import { describe, expect, it } from "vitest";
import { parseSmartFilters } from "./types";

describe("parseSmartFilters", () => {
	it("should return empty arrays for empty input", () => {
		expect(parseSmartFilters("")).toEqual({
			user: [],
			message: [],
			platform: [],
			freeText: [],
		});

		expect(parseSmartFilters("   ")).toEqual({
			user: [],
			message: [],
			platform: [],
			freeText: [],
		});
	});

	it("should parse user: filter", () => {
		const result = parseSmartFilters("user:ninja");
		expect(result.user).toEqual(["ninja"]);
		expect(result.message).toEqual([]);
		expect(result.platform).toEqual([]);
		expect(result.freeText).toEqual([]);
	});

	it("should parse user: filter with multi-word content", () => {
		const result = parseSmartFilters("user:john doe");
		expect(result.user).toEqual(["john doe"]);
	});

	it("should parse message: filter", () => {
		const result = parseSmartFilters("message:hello world");
		expect(result.message).toEqual(["hello world"]);
		expect(result.user).toEqual([]);
	});

	it("should parse platform: filter", () => {
		const result = parseSmartFilters("platform:twitch");
		expect(result.platform).toEqual(["twitch"]);
	});

	it("should parse multiple filters", () => {
		const result = parseSmartFilters("user:ninja platform:twitch");
		expect(result.user).toEqual(["ninja"]);
		expect(result.platform).toEqual(["twitch"]);
	});

	it("should parse combined filters with message content", () => {
		const result = parseSmartFilters("user:chatfan message:GG");
		expect(result.user).toEqual(["chatfan"]);
		expect(result.message).toEqual(["gg"]);
	});

	it("should treat text without prefix as free text", () => {
		const result = parseSmartFilters("hello world");
		expect(result.freeText).toEqual(["hello world"]);
		expect(result.user).toEqual([]);
		expect(result.message).toEqual([]);
		expect(result.platform).toEqual([]);
	});

	it("should extract free text before first filter", () => {
		const result = parseSmartFilters("some text user:ninja");
		expect(result.freeText).toEqual(["some text"]);
		expect(result.user).toEqual(["ninja"]);
	});

	it("should handle case insensitive prefixes", () => {
		const result = parseSmartFilters("USER:Ninja PLATFORM:Twitch");
		expect(result.user).toEqual(["ninja"]);
		expect(result.platform).toEqual(["twitch"]);
	});

	it("should parse RandomViewer correctly", () => {
		const result = parseSmartFilters("user:RandomViewer");
		expect(result.user).toEqual(["randomviewer"]);
		expect(result.freeText).toEqual([]);
	});

	it("should parse ChatFan correctly", () => {
		const result = parseSmartFilters("user:ChatFan");
		expect(result.user).toEqual(["chatfan"]);
		expect(result.freeText).toEqual([]);
	});

	it("should handle all platforms", () => {
		expect(parseSmartFilters("platform:twitch").platform).toEqual(["twitch"]);
		expect(parseSmartFilters("platform:youtube").platform).toEqual(["youtube"]);
		expect(parseSmartFilters("platform:kick").platform).toEqual(["kick"]);
		expect(parseSmartFilters("platform:facebook").platform).toEqual([
			"facebook",
		]);
	});
});
