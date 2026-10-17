import { describe, it, expect } from "vitest";
import { parseListing } from "./listing-pipeline";

const tags = Array.from({ length: 20 }, (_, i) => `tag ${i}`);

describe("parseListing", () => {
  it("caps Etsy tags at 13", () => {
    const out = parseListing(JSON.stringify({ title: "Mug", tags }), "etsy");
    expect(out.tags).toHaveLength(13);
  });
  it("caps eBay titles at 80 characters", () => {
    const out = parseListing(JSON.stringify({ title: "x".repeat(200) }), "ebay");
    expect(out.title.length).toBe(80);
  });
  it("strips DeepSeek think blocks and code fences", () => {
    const raw = '<think>{"title":"wrong"}</think>```json\n{"title":"Right"}\n```';
    expect(parseListing(raw, "etsy").title).toBe("Right");
  });
});
