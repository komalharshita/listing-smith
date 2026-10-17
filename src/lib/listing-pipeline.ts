// Pure, browser-safe pipeline helpers: prompt formatting + structured output parsing.
export type Platform = "etsy" | "ebay";
export type Tone = "warm" | "minimal" | "playful" | "luxury";

export interface ListingInput {
  notes: string;
  platform: Platform;
  tone: Tone;
  price?: string | undefined;
  model: string;
}

export interface Listing {
  title: string;
  description: string;
  bullets: string[];
  tags: string[];
  priceSuggestion: string;
  seoNotes: string;
}

export const OPEN_MODELS = [
  { id: "llama3.3-70b-instruct", label: "Llama 3.3 70B", vendor: "Meta · open-weight" },
  { id: "mistral-nemo-instruct-2407", label: "Mistral Nemo 12B", vendor: "Mistral · Apache 2.0" },
  { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill 70B", vendor: "DeepSeek · MIT" },
  { id: "llama3-8b-instruct", label: "Llama 3 8B", vendor: "Meta · open-weight · fast" },
] as const;

export const PLATFORM_RULES: Record<Platform, { titleMax: number; tagMax: number; tagCharMax: number }> = {
  etsy: { titleMax: 140, tagMax: 13, tagCharMax: 20 },
  ebay: { titleMax: 80, tagMax: 10, tagCharMax: 30 },
};

export function buildMessages(input: ListingInput) {
  const r = PLATFORM_RULES[input.platform];
  const system = `You are ListingSmith, an expert ${input.platform === "etsy" ? "Etsy" : "eBay"} copywriter for small sellers.
Return ONLY a JSON object, no prose, with keys:
"title" (string, max ${r.titleMax} chars, front-load search keywords),
"description" (string, 2-4 short paragraphs, ${input.tone} tone, plain text),
"bullets" (array of 3-6 short feature strings: materials, size, care, shipping),
"tags" (array of up to ${r.tagMax} lowercase search phrases, each max ${r.tagCharMax} chars),
"priceSuggestion" (string, a short price range with one-line reasoning),
"seoNotes" (string, one or two tips to improve ranking).
Never invent certifications or claims not supported by the notes.`;
  const user = `Seller notes:\n${input.notes.trim()}${input.price ? `\nSeller's intended price: ${input.price}` : ""}`;
  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function parseListing(raw: string, platform: Platform): Listing {
  // Strip reasoning blocks (DeepSeek R1) and code fences, then grab the outermost JSON object.
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("The model didn't return a listing. Try again.");
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("The model returned malformed output. Try again.");
  }
  const r = PLATFORM_RULES[platform];
  const tags = Array.isArray(obj["tags"]) ? obj["tags"] : [];
  const seen = new Set<string>();
  const cleanTags = tags
    .map((t) => str(t).toLowerCase().slice(0, r.tagCharMax).trim())
    .filter((t) => t && !seen.has(t) && seen.add(t))
    .slice(0, r.tagMax);
  return {
    title: str(obj["title"]).slice(0, r.titleMax),
    description: str(obj["description"]),
    bullets: (Array.isArray(obj["bullets"]) ? obj["bullets"] : []).map(str).filter(Boolean).slice(0, 6),
    tags: cleanTags,
    priceSuggestion: str(obj["priceSuggestion"]),
    seoNotes: str(obj["seoNotes"]),
  };
}
