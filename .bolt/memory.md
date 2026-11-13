# Project memory

## Product intent & audience

- Business name: **UNIVERSO 22**.
- Site is a production-facing web app with a header (navigation menu), footer, and an admin/settings area.
- Previous footer icon was a truck, suggesting a delivery or service-oriented business — exact domain not yet confirmed.

## Brand personality & voice

- User communicates in Spanish; respond in Spanish unless they switch.
- Prefers minimal, surgical changes to conserve tokens.
- Strongly protective of brand assets: no recreation or alteration of official images.

## Visual design & UX direction

- Official logo is a **circular image** with **transparent background**; must preserve aspect ratio, no cropping or deformation.
- Logo placement: header, navigation menu, and footer brand-identity block.
- Responsive — logo must look crisp on both desktop and mobile.
- Stack: Vite + React (JSX), Tailwind CSS, Lucide React icons; `@/` path alias for `src/`.
- Prior inline icons (flame in header default, truck in footer) have been replaced by the uploaded logo image.

## Decisions, constraints & rationale

- Admin/settings custom-logo option takes priority over the default uploaded logo; both paths must remain functional.
- Only the logo swap was performed — no changes to functionality, buttons, products, other images, or page structure.
- Build passes after the logo replacement.

## Open questions & assumptions

- Exact business category of UNIVERSO 22 not confirmed (truck icon hints at delivery/service).
- The uploaded logo file path in the project is not recorded here; verify the asset path if further logo work is needed.
- No explicit color palette or typography guidance provided yet beyond Tailwind defaults.