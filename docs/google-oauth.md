# Google OAuth setup for miniou

miniou uses Google in two separate ways. They share the same OAuth **Web client** (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) but use different redirect URIs and scopes.

| Flow | Purpose | Redirect URI | Scopes |
|------|---------|--------------|--------|
| **Sign in with Google** | Create / log into a miniou account | `/api/auth/google/callback` | `openid`, `email`, `profile` |
| **Gmail / Calendar connect** | Link integrations in Settings | `/api/integrations/callback` | Gmail + Calendar API scopes (restricted) |

Basic sign-in usually works without app verification. Gmail and Calendar require either **Test users** (while in Testing) or **Google verification + Production** (for any Google account).

---

## 1. Google Cloud Console

Open [Google Cloud Console](https://console.cloud.google.com/) → **Google Auth Platform** (or APIs & Services → OAuth consent screen).

### Enable APIs

In **APIs & Services → Library**, enable:

- Gmail API
- Google Calendar API

### Branding

| Field | Production example |
|-------|-------------------|
| Application home page | `https://miniou.tusharcodes.tech` |
| Privacy policy | `https://miniou.tusharcodes.tech/privacy` |
| Terms of Service | `https://miniou.tusharcodes.tech/terms` |
| Authorised domain | `tusharcodes.tech` (no `https://`) |
| Developer contact | Your email (e.g. `you@gmail.com`) |

Deploy the web app before submitting verification so `/privacy` and `/terms` are publicly reachable.

### Clients (OAuth 2.0 Web client)

**Authorized redirect URIs** must include every environment you use:

```
# Production
https://miniou.tusharcodes.tech/api/auth/google/callback
https://miniou.tusharcodes.tech/api/integrations/callback

# Local dev
http://localhost:8000/api/auth/google/callback
http://localhost:8000/api/integrations/callback
```

Copy the **Client ID** and **Client secret** into `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### Data access (scopes)

If **Verification centre** says *“Verification is not required”*, Gmail/Calendar scopes are probably missing from the consent screen.

Go to **Data access → Add or remove scopes** and add at least:

**Gmail**

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.modify`

**Google Calendar**

- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

Save, then re-open **Verification centre**. Restricted scopes should now require verification for public use.

---

## 2. Testing vs Production

### Option A — You + a few people (fastest)

1. **Audience** → User type: **External**
2. Keep publishing status: **Testing**
3. **Audience → Test users** → add each Gmail address that will connect integrations
4. When connecting Gmail/Calendar, pick **that same Google account** in the OAuth popup

Only listed test users can approve Gmail/Calendar scopes while the app is unverified.

### Option B — Anyone in the world

1. Complete **Branding** (including privacy + terms URLs)
2. Add Gmail/Calendar scopes under **Data access**
3. **Audience** → **Publish app** (Testing → **In production**)
4. **Verification centre** → submit for Google review (demo video + scope justification)
5. Wait for approval (often days to weeks)

Until verification is approved, non–test users will see errors like:

> *tusharcodes.tech has not completed the Google verification process*

---

## 3. Environment variables

From `.env.example`:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CORSAIR_KEK=                    # openssl rand -hex 32
GMAIL_PUBSUB_TOPIC=             # optional — Gmail push webhooks
```

Set the same values on the VPS / Docker env used in production.

After changing `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, or `CORSAIR_KEK`, reconnect integrations (see below).

---

## 4. Store credentials in Corsair

Corsair keeps plugin OAuth settings in the database. After env changes or a bad encrypt state, reset and re-store credentials:

```bash
# Local (from repo root)
pnpm --filter @repo/corsair reset

# Production (inside API container)
docker compose -f docker-compose.prod.yml exec api \
  sh -c 'cd /app/packages/corsair && pnpm reset'
```

Then reconnect Gmail and Calendar in **Settings → Integrations**.

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Sign-in works; Gmail/Calendar blocked | App in Testing; user not a Test user | Add their Gmail under Test users, or complete verification |
| “Verification not required” in console | Scopes not on consent screen | Add scopes under **Data access** |
| `Unsupported state or unable to authenticate data` on connect | `CORSAIR_KEK` changed or partial DB wipe | Run Corsair reset; reconnect |
| Wrong Google account in popup | Multiple Google sessions | Use incognito or sign out; pick the test user account |
| Privacy/terms rejected by Google | Pages not deployed | Push web app; verify URLs load in browser |

---

## 6. Checklist before going public

- [ ] Gmail API + Calendar API enabled
- [ ] Redirect URIs set for prod + local
- [ ] Branding: home, privacy, terms, authorised domain
- [ ] Data access: Gmail + Calendar scopes added
- [ ] App published (In production)
- [ ] Verification submitted and approved
- [ ] `GOOGLE_*` and `CORSAIR_KEK` set on server
- [ ] Corsair reset run after credential/key changes
- [ ] Test connect flow with a non–test-user Google account

---

## Related code

- Google sign-in: `apps/api/src/routes/auth/google.ts`, `packages/services/auth/google.ts`
- Integration OAuth: `apps/api/src/routes/integrations/connect.ts`, `callback.ts`
- Corsair plugins: `packages/corsair/src/corsair.ts`
- Legal pages: `apps/web/app/privacy/page.tsx`, `apps/web/app/terms/page.tsx`
