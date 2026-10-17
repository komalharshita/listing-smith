<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- AI calls go through `src/lib/listing.functions.ts`: built-in AI Gateway by default (`gateway.server.ts`), or any OpenAI-compatible endpoint (DigitalOcean) for open-weight models — keeps models swappable.
- Prompt building and output parsing live in pure `src/lib/listing-pipeline.ts` — so marketplace rules stay unit-testable.
