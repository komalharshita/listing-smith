// Server-only: Lovable AI Gateway call via raw HTTP Responses API, streamed and accumulated.
const LISTING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "bullets", "tags", "priceSuggestion", "seoNotes"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    bullets: { type: "array", items: { type: "string" } },
    tags: { type: "array", items: { type: "string" } },
    priceSuggestion: { type: "string" },
    seoNotes: { type: "string" },
  },
};

export async function callGateway(messages: { role: "system" | "user"; content: string }[]) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      Authorization: `Bearer ${key}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: messages.find((m) => m.role === "system")?.content,
      input: messages.filter((m) => m.role === "user").map((m) => ({ role: "user", content: m.content })),
      reasoning: { effort: "low" },
      store: false,
      stream: true,
      text: { format: { type: "json_schema", name: "listing", strict: true, schema: LISTING_SCHEMA } },
    }),
  });
  if (!res.ok || !res.body) {
    let msg = "";
    try {
      const j = (await res.json()) as { error?: { message?: string }; message?: string };
      msg = j.error?.message || j.message || "";
    } catch { /* ignore */ }
    if (res.status === 402) throw new Error(msg || "AI credits ran out. Add credits in Settings → Plans & credits.");
    if (res.status === 429) throw new Error("Too many requests right now — wait a moment and try again.");
    if (res.status === 403) throw new Error(msg || "AI access was denied for this workspace.");
    throw new Error(msg || `AI request failed (${res.status}).`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  let tokens: number | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, i);
      buf = buf.slice(i + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        let ev: { type?: string; delta?: string; response?: { usage?: { total_tokens?: number }; error?: { message?: string } }; message?: string };
        try { ev = JSON.parse(payload); } catch { continue; }
        if (ev.type === "response.output_text.delta" && ev.delta) text += ev.delta;
        else if (ev.type === "response.completed") tokens = ev.response?.usage?.total_tokens ?? null;
        else if (ev.type === "response.failed" || ev.type === "error")
          throw new Error(ev.response?.error?.message || ev.message || "The AI couldn't finish this listing.");
        else if (ev.type === "response.refusal.delta") throw new Error("The AI declined to write this listing.");
      }
    }
  }
  return { text, tokens };
}
