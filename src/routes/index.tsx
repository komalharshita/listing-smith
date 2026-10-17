import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, Copy, Cpu, Hammer, Loader2, Lock, Tag, Wand2 } from "lucide-react";
import { generateListing } from "@/lib/listing.functions";
import { OPEN_MODELS, type Listing, type Platform, type Tone } from "@/lib/listing-pipeline";
import { ListingCostCalculator } from "@/components/listing-cost-calculator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ListingSmith — open-weight AI listing writer for Etsy & eBay" },
      { name: "description", content: "Turn rough product notes into search-ready Etsy and eBay listings with open-weight models on DigitalOcean." },
      { property: "og:title", content: "ListingSmith — open-weight AI listing writer" },
      { property: "og:description", content: "Search-ready Etsy and eBay listings from rough notes, powered by Llama, Mistral and DeepSeek." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SAMPLE =
  "Hand-thrown stoneware mug, ~350ml, speckled oat glaze with a rust rim. Made in my Pune studio. Dishwasher safe, not microwave. Each one slightly different. Ships in recycled packaging.";

const TONES: Tone[] = ["warm", "minimal", "playful", "luxury"];

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
      aria-label="Copy"
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function Index() {
  const gen = useServerFn(generateListing);
  const [notes, setNotes] = useState(SAMPLE);
  const [platform, setPlatform] = useState<Platform>("etsy");
  const [tone, setTone] = useState<Tone>("warm");
  const [price, setPrice] = useState("");
  const [model, setModel] = useState<string>(OPEN_MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultPlatform, setResultPlatform] = useState<Platform>("etsy");
  const [result, setResult] = useState<{ listing: Listing; meta: { model: string; ms: number; tokens: number | null } } | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const generated = await gen({ data: { notes, platform, tone, price: price || undefined, model } });
      setResult(generated);
      setResultPlatform(platform);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const l = result?.listing;
  const fullText = l
    ? `${l.title}\n\n${l.description}\n\n${l.bullets.map((b) => `• ${b}`).join("\n")}\n\nTags: ${l.tags.join(", ")}`
    : "";

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Hammer className="size-5" />
          </div>
          <span className="font-display text-xl font-semibold">ListingSmith</span>
        </div>
        <span className="stamp rounded-full border bg-paper px-3 py-1 text-moss">Open-weight · on DigitalOcean</span>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-8 pt-4">
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
          Rough notes in. <em className="text-primary">Sell-ready</em> listing out.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          For makers and resellers who'd rather be making. Open models write your title, description and
          tags, tuned to Etsy and eBay rules — swap models anytime, pay pennies per listing.
        </p>
      </section>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 lg:grid-cols-[1fr_1.15fr]">
        {/* Workspace */}
        <div className="card-paper space-y-5 p-6">
          <div>
            <label className="stamp text-muted-foreground">Marketplace</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["etsy", "ebay"] as Platform[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${platform === p ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  {p === "etsy" ? "Etsy" : "eBay"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="stamp text-muted-foreground">Product notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={7}
              className="mt-2 w-full resize-y rounded-lg border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Materials, size, colour, story, care, shipping…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="stamp text-muted-foreground">Tone</label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`rounded-full border px-3 py-1 text-xs capitalize transition ${tone === t ? "border-moss bg-moss text-moss-foreground" : "bg-background hover:bg-muted"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="price" className="stamp text-muted-foreground">Your price (optional)</label>
              <input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. ₹1,200"
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="stamp flex items-center gap-1.5 text-muted-foreground"><Cpu className="size-3.5" /> AI model</label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {OPEN_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`rounded-lg border p-3 text-left transition ${model === m.id ? "border-primary bg-accent" : "bg-background hover:bg-muted"}`}
                >
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.vendor}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={run}
            disabled={loading || notes.trim().length < 10}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            {loading ? "Forging your listing…" : "Write my listing"}
          </button>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" /> Your notes are never stored.
          </p>
        </div>

        {/* Output */}
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
          )}
          {!l && !error && (
            <div className="card-paper grid min-h-[420px] place-items-center p-10 text-center">
              <div>
                <Tag className="mx-auto size-10 text-primary" />
                <h2 className="mt-4 text-2xl font-semibold">Your listing appears here</h2>
                <p className="mt-2 text-sm text-muted-foreground">Title, description, bullet points, tags and a price check.</p>
              </div>
            </div>
          )}
          {l && result && (
            <>
              <div className="flex items-center justify-between">
                <span className="stamp text-muted-foreground">
                  {result.meta.model} · {(result.meta.ms / 1000).toFixed(1)}s{result.meta.tokens ? ` · ${result.meta.tokens} tokens` : ""}
                </span>
                <CopyBtn text={fullText} />
              </div>
              <div className="card-paper p-5">
                <div className="flex items-center justify-between"><span className="stamp text-primary">Title · {l.title.length} chars</span><CopyBtn text={l.title} /></div>
                <h2 className="mt-2 text-2xl font-semibold leading-snug">{l.title}</h2>
              </div>
              <div className="card-paper p-5">
                <div className="flex items-center justify-between"><span className="stamp text-primary">Description</span><CopyBtn text={l.description} /></div>
                <div className="mt-2 space-y-3 whitespace-pre-line text-sm leading-relaxed">{l.description}</div>
                {l.bullets.length > 0 && (
                  <ul className="mt-4 space-y-1.5 border-t pt-4 text-sm">
                    {l.bullets.map((b) => (
                      <li key={b} className="flex gap-2"><span className="text-moss">◆</span>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="card-paper p-5">
                <div className="flex items-center justify-between"><span className="stamp text-primary">Tags · {l.tags.length}</span><CopyBtn text={l.tags.join(", ")} /></div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {l.tags.map((t) => (
                    <span key={t} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">{t}</span>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="card-paper p-5">
                  <span className="stamp text-moss">Price check</span>
                  <p className="mt-2 text-sm">{l.priceSuggestion || "—"}</p>
                </div>
                <div className="card-paper p-5">
                  <span className="stamp text-moss">SEO tip</span>
                  <p className="mt-2 text-sm">{l.seoNotes || "—"}</p>
                </div>
              </div>
            </>
          )}
          <ListingCostCalculator key={l ? resultPlatform : platform} platform={l ? resultPlatform : platform} />
        </div>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        MIT licensed · Powered by open-weight models on DigitalOcean GenAI
      </footer>
    </div>
  );
}
