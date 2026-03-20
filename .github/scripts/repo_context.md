# info-whisperer-lab — Repository Context

TypeScript/React frontend (Vite + Shadcn/UI) for a RAG-powered knowledge assistant.

## Branch purposes

### `main` (cloud deployment)
- Connects to a cloud-hosted Model-Router-API
- API base URL comes from `VITE_API_URL` env var pointing to the cloud service
- Standard authentication via Supabase
- Standard Dockerfile for cloud/production deployment

### `local-deploy` (offline/local deployment)
- Connects to a local Model-Router-API running on `localhost:8000`
- Can also use a local LLM inference server (Ollama) via `VITE_LOCAL_INFERENCE_URL`
- Modified `src/lib/api.ts` to handle localhost base URLs
- Modified `src/lib/auth-client.ts` for local auth handling
- Modified `src/lib/stream-query.ts` for local streaming endpoint
- `src/pages/AIConfig.tsx` has extra UI for configuring local model URL
- `.env.local.example` contains local deployment environment variables
- `Dockerfile` has extra steps for local Docker build

## Rules for sync decisions

### NEVER sync (deployment-specific):
- `Dockerfile` — each branch has its own build instructions
- `.env`, `.env.local.example`, `.env.example` — environment configs differ
- Any code that hardcodes `localhost` or reads `VITE_LOCAL_*` env vars
- Ollama / local LLM inference logic
- Local model URL input fields in AIConfig.tsx

### ALWAYS sync (shared logic):
- All UI components under `src/components/`
- All pages under `src/pages/` (excluding local-deploy-specific sections in AIConfig.tsx)
- Hooks in `src/hooks/`
- Utilities in `src/lib/` that are not URL/auth related
- Bug fixes anywhere — adapt URL/env references if needed
- UX and visual improvements
- New features that are not deployment-specific
- Type definitions in `src/types/`
- Test files in `src/test/`

### ADAPT (sync with modifications):
- Changes to `src/lib/api.ts` that fix logic but also touch base URLs — keep the fix, preserve each branch's URL config
- Changes to `src/pages/AIConfig.tsx` that improve the cloud config UI — replicate the improvement but leave the local model section intact on local-deploy
