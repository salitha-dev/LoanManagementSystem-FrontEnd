# Loan Management System — Frontend

React 19 + TypeScript + Vite 7 SPA on the Facit (Bootstrap 5) admin theme.

```bash
cp .env.example .env     # set VITE_API_PROXY_TARGET to the backend URL
npm install
npm run dev              # http://127.0.0.1:5174
npm run build            # typecheck + production build → dist/
```

- API base: `VITE_API_URL` (default `/api/v1`, proxied in dev). Build-time only; rebuild after changes.
- `VITE_AUTH_MODE=demo` signs in offline for UI work (`admin@lms.local` / `password`). Never use it in production.
- Conventions: [CLAUDE.md](CLAUDE.md) and `.claude/skills/lms-frontend/SKILL.md`.

Theme code is derived from the Facit template as used in the CoolPay project and is distributed under the GPL-3.0 licence in [LICENSE](LICENSE).
