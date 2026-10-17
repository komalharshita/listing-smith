import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildMessages, parseListing, OPEN_MODELS, GATEWAY_MODEL_ID } from "./listing-pipeline";
import { callGateway } from "./gateway.server";

const InputSchema = z.object({
  notes: z.string().min(10, "Add a few more details about the product").max(4000),
  platform: z.enum(["etsy", "ebay"]),
  tone: z.enum(["warm", "minimal", "playful", "luxury"]),
  price: z.string().max(40).optional(),
  model: z.string().refine((m) => OPEN_MODELS.some((o) => o.id === m), "Unknown model"),
});

async function callDigitalOcean(model: string, messages: ReturnType<typeof buildMessages>) {
  const apiKey = process.env["DIGITALOCEAN_GENAI_API_KEY"];
  const baseUrl = process.env["DIGITALOCEAN_GENAI_BASE_URL"] || "https://inference.do-ai.run/v1";
  if (!apiKey) throw new Error("Open-weight models need a DigitalOcean key. Pick Lovable AI for now.");
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.6, max_tokens: 1400 }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("DigitalOcean rejected the API key.");
    if (res.status === 429) throw new Error("Rate limited by DigitalOcean — wait a moment and retry.");
    throw new Error(`Model request failed (${res.status}).`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { total_tokens?: number } };
  return { text: json.choices?.[0]?.message?.content ?? "", tokens: json.usage?.total_tokens ?? null };
}

export const generateListing = createServerFn({ method: "POST" })
  .inputValidator((d) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const started = Date.now();
    const messages = buildMessages(data);
    const out = data.model === GATEWAY_MODEL_ID ? await callGateway(messages) : await callDigitalOcean(data.model, messages);
    return {
      listing: parseListing(out.text, data.platform),
      meta: { model: data.model, ms: Date.now() - started, tokens: out.tokens },
    };
  });
