# ListingSmith

**Rough notes in, sell-ready listing out.** An open-weight AI listing writer for Etsy and eBay sellers, running on DigitalOcean GenAI Serverless Inference.

Built for *Hacktoberfest Hack Day Pune × AI Hackers Collective — Best Open-Source AI Project (Side Hustle theme).*

## Why someone would pay for it
Small makers spend 20–40 minutes per listing fighting title limits, 13-tag rules and SEO. ListingSmith produces a marketplace-compliant title, description, bullets, tags, price check and SEO tip in seconds, for well under a cent per listing.

## Why open weights matter here
- **Swap models freely** — Llama 3.3 70B, Mistral Nemo, DeepSeek R1 Distill, Llama 3 8B. Pick quality vs. speed per listing.
- **Cost** — open models on serverless inference cost a fraction of closed APIs; a seller can generate hundreds of listings for a few rupees.
- **Data control** — seller notes go only to the seller's own DigitalOcean endpoint; nothing is stored. Point `DIGITALOCEAN_GENAI_BASE_URL` at a local Ollama/vLLM server (`http://localhost:11434/v1`) and it runs fully offline.
- **Tunable** — prompts and parsing rules are plain code in `src/lib/listing-pipeline.ts`; fine-tune a model on your best-selling listings and plug it in.

## Architecture
```text
 Browser (React + Tailwind)          Server function (TanStack Start)         DigitalOcean GenAI
 ┌─────────────────────────┐  RPC   ┌──────────────────────────────────┐ HTTPS ┌───────────────────────┐
 │ Workspace: notes, tone, │ ─────► │ validate (zod)                   │ ────► │ /v1/chat/completions  │
 │ platform, model picker  │        │ buildMessages()  platform rules  │       │ Llama / Mistral /     │
 │ Output cards + copy     │ ◄───── │ parseListing()   JSON + limits   │ ◄──── │ DeepSeek (open-weight)│
 └─────────────────────────┘        └──────────────────────────────────┘       └───────────────────────┘
```

| Layer | File |
| --- | --- |
| UI dashboard | `src/routes/index.tsx` |
| AI service connector | `src/lib/listing.functions.ts` |
| Prompt + structured-output pipeline | `src/lib/listing-pipeline.ts` (+ tests) |
| Deployment | `Dockerfile`, `.do/app.yaml` |

## Environment variables
| Name | Required | Description |
| --- | --- | --- |
| `DIGITALOCEAN_GENAI_API_KEY` | yes | Model access key from DigitalOcean → GenAI Platform → Serverless Inference |
| `DIGITALOCEAN_GENAI_BASE_URL` | no | Defaults to `https://inference.do-ai.run/v1`. Any OpenAI-compatible endpoint works (Ollama, vLLM). |

## Run locally
```bash
bun install
export DIGITALOCEAN_GENAI_API_KEY=...
bun run dev        # http://localhost:8080
bun run test       # listing rule tests
```

## Deploy to DigitalOcean
1. Push this repo to GitHub and edit `repo:` in `.do/app.yaml`.
2. `doctl apps create --spec .do/app.yaml`
3. Set `DIGITALOCEAN_GENAI_API_KEY` as a secret in the App Platform dashboard.

Or on a Droplet: `docker build -t listingsmith . && docker run -p 8080:8080 -e DIGITALOCEAN_GENAI_API_KEY=... listingsmith`

## License
MIT — see `LICENSE`. Models are used under their own licenses (Llama Community License, Apache 2.0, MIT).
