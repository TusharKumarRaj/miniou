# Swapping the miniou UI

The web app is split into two layers. You can replace the UI without touching backend logic.

## Architecture

```
apps/web/
├── hooks/api/          ← KEEP: tRPC hooks (auth, gmail, calendar, chat)
├── trpc/               ← KEEP: client setup
├── providers/          ← KEEP: React Query, session sync
├── app/
│   ├── mail/page.tsx   ← KEEP logic, REPLACE layout/components
│   ├── calendar/       ← same
│   ├── chat/           ← same
│   └── login/signup    ← same
├── components/         ← REPLACE (or swap import path)
├── app/globals.css     ← REPLACE theme
└── public/             ← REPLACE assets
```

**Rule:** Pages call hooks and render UI. Hooks talk to `@repo/trpc`. The API does not care what the front-end looks like.

---

## Step 1 — Preserve current UI (done)

Current neon/glass UI is snapshotted in:

**`design/miniou-neon-ui/`**

Copy that folder to another project or tag the repo:

```bash
git tag ui-neon-v1
```

---

## Step 2 — Choose a new UI direction

Pick one approach for the instructor-facing rebuild:

| Option | Vibe | Effort |
|--------|------|--------|
| **shadcn/ui** | Clean, professional, common in production apps | Medium — install components, rebuild pages |
| **Minimal neutral** | White/gray, no mascot backgrounds, system fonts | Low — new globals.css + simple components |
| **Material / MUI** | Enterprise look | Medium — different component library |
| **Tailwind UI / Catalyst** | Polished templates | Low–medium — paid or template-based |

For a school/instructor project, **shadcn/ui + light or neutral dark theme** (no full-screen SVG backgrounds) usually reads as more mature.

---

## Step 3 — Swap UI in miniou

### A. New theme

1. Replace `apps/web/app/globals.css` with a new theme (remove `.miniou-*` classes or keep as legacy).
2. Remove or stop using full-screen background images in `AppShell` / pages.

### B. New components

1. Add a component library (e.g. `npx shadcn@latest init` in `apps/web`).
2. Create `components/ui/button.tsx`, `input.tsx`, etc. from the library.
3. Page-by-page, replace `MiniouButton` → `Button`, `MiniouPanel` → `Card`, etc.

### C. Simplify layout

Replace `AppShell` + background images with a simple layout:

```tsx
// components/layout/dashboard-layout.tsx
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b px-6 py-4">…nav…</header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
```

### D. Keep hooks unchanged

```tsx
// mail/page.tsx — logic stays, shell changes
const { data: messages } = useGmailMessages(label);
return (
  <DashboardLayout>
    <MailList messages={messages} />
  </DashboardLayout>
);
```

---

## Step 4 — What not to change

- `hooks/api/*`
- `trpc/*`
- `providers/*`
- `env.js`
- Page routing structure (`/mail`, `/calendar`, `/chat`, `/settings/integrations`)

---

## Suggested rebuild order

1. `layout.tsx` + global styles + nav
2. Login / signup (simple forms)
3. Settings / integrations
4. Mail inbox
5. Calendar
6. Chat

Ship incrementally so the app keeps working after each page.

---

## Need help?

Say which direction you want (e.g. “shadcn light theme”) and we can scaffold the new layout and refactor the first page as a template for the rest.
