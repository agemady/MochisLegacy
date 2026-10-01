# Deploy Mochi's Legacy to Cloudflare Pages

Production host: **Cloudflare Pages** on **`mochislegacy.com`**.

Repo: `agemady/MochisLegacy`. Build: `npm run build` → `dist/`. Only the overseer (`w2:p8`) pushes `origin/main`.

## 1. Create the Pages project

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Import an existing Git repository**.
2. Authorize GitHub and select `agemady/MochisLegacy`.
3. Build settings:

   | Field | Value |
   |---|---|
   | Production branch | `main` |
   | Framework preset | Vite |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | `/` (repo root) |
   | Node version | `22` (set `NODE_VERSION=22` under environment variables) |

4. **Save and Deploy**. First production URL is `https://<project>.pages.dev`.

Every push to `main` rebuilds production. Pull requests get preview URLs (`*.<project>.pages.dev`).

## 2. Environment variables

Set these on the Pages project (**Settings → Environment variables**) for **Production** and **Preview**. Vite inlines `VITE_*` at build time — changing a value requires a new deploy.

| Name | Value |
|---|---|
| `NODE_VERSION` | `22` |
| `VITE_SUPABASE_URL` | URL of the (shared) Supabase project that holds the `mochi_` tables (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | That project's **anon public** key |

- The anon key is public by design. For Mochi's tables it may only `EXECUTE` the `mochi_*` functions (see [supabase/README.md](../supabase/README.md)). Never add `service_role` (or any other secret) to Pages.
- No Supabase Auth settings (site URL, redirect URLs, SMTP) are needed: the scheduler uses personal links, not sign-ins.
- Do not commit real values. Local copies live in `.env` (gitignored); the shape is in `.env.example`.

## 3. Attach `mochislegacy.com`

Apex domains on Pages must be a **zone on the same Cloudflare account**.

1. If `mochislegacy.com` is not already a Cloudflare zone: add the site, point the registrar nameservers at Cloudflare, wait until the zone is active.
2. Pages project → **Custom domains** → **Set up a domain** → `mochislegacy.com`.
3. Cloudflare creates the apex CNAME (flattened) to `<project>.pages.dev`.
4. Repeat for `www.mochislegacy.com` (CNAME → `<project>.pages.dev`), then redirect `www` → apex (or the reverse) with a Redirect Rule so there is one canonical origin.
5. Wait for the certificate. If the zone has CAA records, they must allow Let's Encrypt / Google Trust Services / SSL.com (see [Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)).

Until the zone is on Cloudflare nameservers, Pages cannot serve the apex. A registrar-only CNAME works for a **subdomain**, not `mochislegacy.com` itself.

Optional: bulk-redirect `<project>.pages.dev` → `https://mochislegacy.com` so the `pages.dev` URL is not a second public origin.

## 4. After the first production URL exists

- Swap the flyer QR target to `https://mochislegacy.com` and re-print / re-scan (iPhone + Android). Printed kickoff is **October 2 · Foothills Community Park, Shelter A** (time TBA).
- Confirm a signup from the live page lands in Supabase (or demo-mode is **off** — env vars must be present on the **Production** environment).
- Preview deployments use Preview env vars; give them the same Supabase project unless you stand up a staging project.

## 5. Local check before asking for a push

```bash
npm run build
npm run lint
```

Both must be green. The overseer pushes `main`; that push is what deploys.

## References

- [Deploy a Vite site](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/)
- [Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
