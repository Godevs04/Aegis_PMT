# Implementation Plan — Resolving Blank Screen Route Conflict

The blank page issue is caused by a route conflict in Next.js: both the landing page (`src/app/page.tsx`) and the dashboard page (`src/app/(dashboard)/page.tsx`) compete for the root `/` path. When a user is logged in, the root page (`src/app/page.tsx`) returns `null` expecting the route group page to render, but Next.js does not fallback dynamically, resulting in a blank screen.

This plan resolves this by:
1. Moving the dashboard page from `/` to `/dashboard`.
2. Setting up a client-side redirect on the root landing page `/` to send logged-in users to `/dashboard`.
3. Updating links and shortcuts pointing to the dashboard to use `/dashboard` instead of `/`.

## Proposed Changes

### Next.js Routing Structure

---

#### [NEW] [(dashboard)/dashboard/page.tsx](file:///Users/kavinkumar/Kavin/Godevs/Project-Management/project-management-web/src/app/(dashboard)/dashboard/page.tsx)
- Move the contents of `src/app/(dashboard)/page.tsx` here.

#### [DELETE] [(dashboard)/page.tsx](file:///Users/kavinkumar/Kavin/Godevs/Project-Management/project-management-web/src/app/(dashboard)/page.tsx)
- Remove this file after moving it to the `/dashboard` folder.

#### [MODIFY] [page.tsx](file:///Users/kavinkumar/Kavin/Godevs/Project-Management/project-management-web/src/app/page.tsx)
- Update the component to dynamically redirect authenticated users to `/dashboard` instead of returning `null`.

#### [MODIFY] [sidebar.tsx](file:///Users/kavinkumar/Kavin/Godevs/Project-Management/project-management-web/src/components/layout/sidebar.tsx)
- Update the 'Dashboard' navigation item `href` to `/dashboard`.
- Adjust `isActive` matching logic to check for `/dashboard`.

#### [MODIFY] [use-keyboard-shortcuts.ts](file:///Users/kavinkumar/Kavin/Godevs/Project-Management/project-management-web/src/hooks/use-keyboard-shortcuts.ts)
- Update `g d` shortcut handler to route to `/dashboard`.

#### [MODIFY] [login-form.tsx](file:///Users/kavinkumar/Kavin/Godevs/Project-Management/project-management-web/src/features/auth/components/login-form.tsx)
- Update redirection after successful login to `/dashboard` instead of `/`.

#### [MODIFY] [onboarding/organization/page.tsx](file:///Users/kavinkumar/Kavin/Godevs/Project-Management/project-management-web/src/app/onboarding/organization/page.tsx)
- Update redirection after completing onboarding setup to `/dashboard` instead of `/`.

---

## Verification Plan

### Automated Checks
- Run `npm run build` in the frontend directory to ensure the new routing structure builds successfully without errors.
