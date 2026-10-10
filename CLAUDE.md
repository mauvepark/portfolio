# Noor Ali — Portfolio

Personal portfolio site for Noor Ali, a third-year software engineering student (University of Calgary) targeting PM and SWE internships for 2027.

## Stack
Next.js 15 (App Router, TypeScript) — Supabase + Vercel planned. `npm run dev` / `npm run build`.
- Keep TypeScript on 5.x (Next 15 can't resolve `@/` path aliases with TS 7).
- `app/` routes · `components/` (sketch primitives in `components/sketch/`) · `lib/content.ts` reads MDX · `lib/site.ts` holds email + links.
- Projects and notes are MDX in `content/projects` and `content/notes` (frontmatter drives cards: `order`, `image`/`imageAlt`/`imageFit` for covers in `public/projects/`).
- On the homepage, projects and notes open as cards (`components/sketch/SketchDialog.tsx`) with linkable hashes `#project-<slug>` / `#note-<slug>`; `/projects/[slug]` and `/notes/[slug]` pages still exist for direct links.
- `design/` holds the original static mockup for visual reference — not served.
- Roadmap: `~/.claude/plans/i-have-some-very-hashed-russell.md` (doodle guestbook → sketchbook page-turn → live workbench).

## Sections (anchor ids in index.html)
- `#about` — intro, photo frame, resume/LinkedIn/GitHub buttons
- `#projects` — six project cards (JAppL, Ramble, LockedIn, Solar Car Telemetry, VCT 2025 Player Analytics, Anything but JUNK)
- `#skills` — Languages & Frameworks / Tools & Technologies / Product Skills (sourced from public/resume.pdf) + "off the clock"
- `#notes` — blog list
- `#contact` — "let's talk" box and footer

## Visual style: graphite sketchbook
- Paper ground `#F3F1EC` with a faint dot grid; cards `#FBFAF7`; ink `#262624`; one accent `--accent` (`#A8432E`, pencil red).
- Fonts: Caveat (handwritten headings), Karla (body), IBM Plex Mono (labels, nav, buttons in `[BRACKETS]`).
- Hand-drawn borders: the `.sketch` class draws two wobbly pencil strokes via `::before`/`::after` using the SVG displacement filters `#pencil` and `#pencil2` defined at the top of the body. Put `.sketch` on any element to give it a pencil outline.
- `.hatch` = diagonal pencil hatching used for image placeholders.
- Keep it monochrome graphite + the single accent so hand-drawn art drops in cleanly.
- Respect `prefers-reduced-motion`; keep touch targets ≥44px.

## To do
- Replace placeholders: `[your photo]`, email + links in `lib/site.ts`, hatched image boxes, note dates `[YYYY-MM-DD]`, case study text in `content/projects/*.mdx`.
- Shared styles/tokens live in `app/globals.css`; prefer classes and `var(--…)` tokens over new inline styles.
