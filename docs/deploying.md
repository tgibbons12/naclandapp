# Deploying

The app is a static Vite SPA: `npm run build` emits `dist/`, and the host only has
to serve those files with a catch-all rewrite to `index.html` so client-side
routes resolve.

## Local

```
npm run dev       # localhost:5173, hot reload — the right loop for UI work
npm run preview   # serves the built dist/, closer to production
```

Prefer `npm run dev` over deploying to check a layout change. It is faster and
costs no build minutes.

## Netlify (primary)

Config lives in `netlify.toml`. Auto-deploys on push to `main`.

Free tier: 300 build minutes and 100 GB bandwidth per month, resetting on the
billing date (team created 12 March, so the 12th). **Every push to `main`
triggers a build**, so batch commits when working through a series of small
changes, and add `[skip ci]` to the commit message for docs-only edits.

## Cloudflare Pages (alternative)

Useful as a second host or when Netlify's build minutes are exhausted —
Cloudflare's free tier does not cap builds. Connect the same GitHub repo at
dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git:

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 20 or later (set `NODE_VERSION` if the default is older) |

Cloudflare ignores `netlify.toml`, so the SPA rewrite comes from `public/_redirects`,
which Vite copies verbatim into `dist/`. That file is also valid Netlify syntax, so
both hosts work from one repo with no branching config.

Both can run at once — same repo, two deployments, no interference.
