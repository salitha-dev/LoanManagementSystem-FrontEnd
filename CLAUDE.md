# LoanManagementSystem-FrontEnd

React 19 + TypeScript 6 + Vite 7 + React Router 7 on the Facit admin theme (Bootstrap 5, Sass, Formik, Axios). For structure, component catalogue and recipes, load skill `lms-frontend`.

## Rules

- Reuse before writing: `src/components/bootstrap/*`, `src/components/common/*` (DataTable, FieldError, FormErrorSummary, RequireRole), `src/layout/*`, hooks in `src/hooks/`. Copy a sibling page's structure. No new UI library or second theme.
- All HTTP goes through `src/api/client.ts` (`apiRequest` unwraps `{ data }`, `apiPayload` keeps `meta`). One service file per module: `src/api/<module>.service.ts`. Types in `src/api/types.ts` or the module service. Never call axios/fetch in components.
- Env reads only in `src/config/app.ts` (app settings) or the theme layer. `VITE_*` values are public: no secrets.
- Navigation and permissions: add the item in `src/menu.ts` (with `permissions`), the lazy route in `src/routes/contentRoutes.tsx` via `guarded()`. Permission names match the backend exactly.
- Sidebar behaviour (keep for every new menu; logic lives in `src/layout/Navigation/Navigation.tsx`, don't add per-menu code): accordion, so only the groups on the path to the selected item stay expanded and all others collapse. Drill-in: inside a group, an open sub-group hides its sibling links (Admin › Facility Management shows only Facility links); clicking the parent group steps back to its own links. Top-level items (Dashboard, Admin, …) always stay visible.
- Forms: Formik + `FormGroup`/`Input`; map API 422 errors with `helpers/formErrors.ts`. Notify with `helpers/appNotify.tsx`; confirm destructive actions with `useConfirm`.
- Buttons: use `action='save' | 'delete' | ...` (`helpers/uiActions.ts`) for consistent colour/icon.
- Pages in `src/pages/<module>/`, PascalCase `*Page.tsx`; hooks `useX.ts`; services camelCase `<module>.service.ts`.
- Keep the build clean: `npm run typecheck` = 0 errors and `npx eslint <changed files>` = 0 errors before reporting done.

## Commands

```bash
npm run dev                 # http://127.0.0.1:5174, /api proxied to VITE_API_PROXY_TARGET
npm run typecheck
npx eslint src/pages/<module>
npm run build               # typecheck + vite build
```
