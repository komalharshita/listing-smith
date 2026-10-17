import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildMessages, parseListing, OPEN_MODELS } from "./listing-pipeline";

const InputSchema = z.object({
  notes: z.string().min(10, "Add a few more details about the product").max(4000),
  platform: z.enum(["etsy", "ebay"]),
  tone: z.enum(["warm", "minimal", "playful", "luxury"]),
  price: z.string().max(40).optional(),
  model: z.string().refine((m) => OPEN_MODELS.some((o) => o.id === m), "Unknown model"),
});

export const generateListing = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["DIGITALOCEAN_GENAI_API_KEY"];
    const baseUrl = process.env["DIGITALOCEAN_GENAI_BASE_URL"] || "https://inference.do-ai.run/v1";
    if (!apiKey) throw new Error("DigitalOcean GenAI key is not configured yet.");

    const started = Date.now();
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: data.model,
        messages: buildMessages(data),
        temperature: 0.6,
        max_tokens: 1400,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 401) throw new Error("DigitalOcean rejected the API key.");
      if (res.status === 429) throw new Error("Rate limited by DigitalOcean — wait a moment and retry.");
      throw new Error(`Model request failed (${res.status}). ${text.slice(0, 160)}`);
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    return {
      listing: parseListing(content, data.platform),
      meta: { model: data.model, ms: Date.now() - started, tokens: json.usage?.total_tokens ?? null },
    };
  });
