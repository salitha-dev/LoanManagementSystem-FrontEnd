---
name: lms-frontend
description: >-
  LoanManagementSystem-FrontEnd structure, reusable Facit theme components and
  recipes (React 19 + TypeScript + Vite 7, Bootstrap 5, Formik, Axios). Use for
  any page, API service, menu/route, permission gate, form, table, theme or
  style change in the frontend. Not for the Laravel backend.
---

# LMS frontend

## Where things live

| Concern | Location |
|---|---|
| App settings from env (name, API URL, auth mode, storage keys) | `src/config/app.ts` |
| HTTP client, token storage, 401 handling | `src/api/client.ts` |
| Shared API types (`ApiError`, `PaginatedResponse`, `AuthUser`) | `src/api/types.ts` |
| Auth calls | `src/api/auth.service.ts`; state in `src/contexts/authContext.tsx` |
| Menu + permission filtering + `canAccessPath` | `src/menu.ts` |
| Routes (lazy) | `src/routes/contentRoutes.tsx`; layout per route in `asideRoutes`/`headerRoutes`/`footerRoutes` |
| Shell | `src/layout/*` (Aside, Header, SubHeader, Page, PageWrapper, Navigation, Footer) |
| Header right side (dark mode, fullscreen, profile) | `src/pages/_layout/_headers/CommonHeaderRight.tsx` |
| Theme state (aside, dark mode, fullscreen) | `src/contexts/themeContext.tsx`, `src/hooks/useDarkMode.ts` |
| Sass entry / theme tokens | `src/styles/styles.scss`, `src/styles/settings/_index.scss`; brand overrides in `src/styles/custom/_theme-ui.scss` (large: grep, don't read whole) |
| Logo (placeholder SVG) | `src/components/Logo.tsx`, `public/favicon.svg` |

## Reusable building blocks

- Bootstrap wrappers: `components/bootstrap/` Button (`action` presets), Card (`CardHeader/CardLabel/CardTitle/CardBody/CardActions`), Modal, OffCanvas, Dropdown, Badge, Alert, Spinner, Pagination, Popovers/Tooltips, forms (`FormGroup`, `Input`, `Select`, `SearchableSelect`, `Textarea`, `Checks`, `InputGroup`).
- `components/common/DataTable.tsx`: sortable/searchable table, client or server pagination, Excel/CSV/PDF export (`helpers/tableExport.ts`).
- `components/common/FieldError.tsx`, `FormErrorSummary.tsx`; `helpers/formErrors.ts` (`toFieldErrors(error)` maps 422 → Formik).
- `components/common/RequireRole.tsx` (route guard), `HomeRedirect.tsx`.
- Others: `Wizard`, `PaginationButtons`, `Avatar`, `extras/Chart` (ApexCharts), `extras/Timeline`, `icon/Icon` (Material icon names, PascalCase).
- Hooks: `useConfirm`, `useDebouncedSearch`, `useClientTablePagination`, `useSortableData`, `useOpenRecordParam`, `useDarkMode`.
- Helpers: `appNotify` (`showAppSuccess/Error/Info`), `confirmOptions`, `datetime`, `serverPagination`, `fetchAllPaginatedItems`, `media` (`mediaUrl`).

## Recipe: new module page (e.g. Loan Products)

1. Types + calls in `src/api/loanProducts.service.ts` using `apiRequest`/`apiPayload<PaginatedResponse<T>>` and relative paths (`/loan-products`).
2. Page `src/pages/loanProducts/LoanProductsPage.tsx`: `PageWrapper` → `SubHeader` → `Page` → `Card` + `DataTable`; create/edit in a `Modal` with Formik.
3. Menu entry in `appMenu` (`src/menu.ts`) with `permissions: ['loan_products.view']` (same names as backend).
4. Route: `guarded(appMenu.loanProducts.path, <LoanProductsPage />)` in `contentRoutes.tsx` with a `lazy()` import.
5. Hide actions the user lacks with `hasPermission(user, '...')` (`helpers/permissions.ts`); the backend still enforces.
6. `npm run typecheck` and `npx eslint src/pages/loanProducts src/api/loanProducts.service.ts`.

## Conventions

- Money from the API is a decimal string (`"150000.50"`): keep it a string, format for display only (`formatMoney` in `api/finance.service.ts`), send the string back; never do float arithmetic on amounts.
- Auth modes: `VITE_AUTH_MODE=api` (real) or `demo` (offline UI work only: `admin@lms.local` / `password`).
- Keep inherited theme files as they are unless the task targets them; Prettier/ESLint baseline is clean, keep it that way.
