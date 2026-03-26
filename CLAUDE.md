# Distilld Site — Project Logic

## Overview

Marketing landing page for Distilld — a Canadian legal/regulatory alert service for businesses. Purely static Astro site deployed to Cloudways via GitHub Actions on every push to `master`.

**Live URL:** https://distilld.ca
**Repo:** FattyFatty001/Distilld-Site

---

## Tech Stack

| Concern | Tool |
|---|---|
| Framework | Astro 6 (static output) |
| Styling | Tailwind CSS (loaded via CDN — no build step required) |
| Fonts | Manrope (headlines), Inter (body) — Google Fonts |
| Icons | Material Symbols Outlined — Google Fonts |
| Email collection | Brevo (formerly Sendinblue) |
| Hosting | Cloudways (static file serving via nginx) |
| CI/CD | GitHub Actions → SFTP to Cloudways |

---

## Project Structure

```
Distilld Site/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Auto-deploy on push to master
├── public/
│   ├── favicon.svg / favicon.ico
│   └── .htaccess               # Cache-control: no-cache for HTML
├── src/
│   ├── layouts/
│   │   └── Layout.astro        # Global layout: nav, footer, Tailwind config, theme
│   └── pages/
│       ├── index.astro         # Homepage with email signup form
│       ├── privacy.astro       # Privacy policy (placeholder)
│       └── terms.astro         # Terms of service (placeholder)
├── astro.config.mjs            # site: https://distilld.ca, static output
└── package.json
```

---

## Design System

Configured in `Layout.astro` via the Tailwind CDN config block. Uses **Material Design 3** colour tokens as custom Tailwind colours (e.g. `text-primary`, `bg-surface-container`, `text-on-surface-variant`).

**Custom utility classes** (defined in `<style is:global>`):
- `.primary-gradient` — dark navy diagonal gradient used on the CTA button
- `.ios-shadow` — subtle shadow used on the email input field
- `.bg-glass` — backdrop blur for glass-morphism effects

**Font families:**
- `font-headline` → Manrope (headings, buttons)
- `font-body` / `font-label` → Inter (body copy)

---

## Pages

### `/` — Homepage (`index.astro`)
Beta signup landing page. Contains the hero headline, copy, and the Brevo email capture form.

### `/privacy` — Privacy Policy
Placeholder page ("Coming soon").

### `/terms` — Terms of Service
Placeholder page ("Coming soon").

---

## Email Collection — Brevo Integration

### How it works

Emails are collected via **Brevo's subscription form** (single opt-in — contacts appear in the list immediately on submit).

The form uses `fetch()` to POST to Brevo's `?isAjax=1` endpoint. Brevo's `main.js` is intentionally **not used** — it only works reliably on forms hosted on Brevo's own pages.

**Key discovery**: Brevo silently ignores native form POSTs to the base action URL. The real submission endpoint is `[action]?isAjax=1`, which returns `{"success":true}` on success. Brevo mirrors the request's `Origin` in the `access-control-allow-origin` response header, so `fetch()` from any domain works without CORS issues.

### Form IDs / field names required by Brevo

| Attribute | Value | Reason |
|---|---|---|
| `form#id` | `sib-form` | Brevo's script finds the form by this ID |
| `form[data-type]` | `subscription` | Tells Brevo's script the form type |
| `input[name]` | `EMAIL` | Must be uppercase — Brevo's field name |
| `input[data-required]` | `true` | Brevo validation |
| `input[name=email_address_check]` | empty | Brevo's built-in anti-spam honeypot |
| `input[name=locale]` | `en` | Brevo locale |

### Success / error messages

`#success-message` and `#error-message` divs are in the DOM (initially `display:none`). Brevo's script toggles them via `style.display`. They are styled with Tailwind to match the site design rather than using Brevo's default CSS (Brevo's `sib-styles.css` is intentionally **not** included).

### No Brevo JS needed

Brevo's `main.js` is not loaded. Our own `fetch()` call to `[action]?isAjax=1` handles submission, and we read the JSON response to show the correct success or error state.

---

## Anti-Spam

No CAPTCHA. Two invisible measures applied before the `fetch()` call:

### 1. Honeypot field
```html
<input type="text" name="website" value=""
  style="position:absolute;left:-9999px;opacity:0;height:0;"
  tabindex="-1" autocomplete="off" />
```
Pushed off-screen and invisible to users. Spam bots fill all inputs automatically — if this field has any value on submit, the submission is silently faked (shows success, nothing sent to Brevo).

### 2. Time check
The page load timestamp is stored in `form.dataset.loadedAt`. On submit, if fewer than **3 seconds** have elapsed, it's treated as a bot and silently faked. Real users take longer than 3 seconds; bots submit instantly.

### Implementation pattern
```js
form.addEventListener('submit', function(e) {
  // check honeypot & time...
  // if bot: e.preventDefault() + e.stopImmediatePropagation() + showFakeSuccess
  // if human: disable button, let Brevo's handler proceed
}, true); // true = capture phase, runs before Brevo's bubbling-phase handler
```

---

## Deployment — GitHub Actions

**File:** `.github/workflows/deploy.yml`
**Trigger:** Push to `master` branch

### Steps
1. Checkout repo
2. Setup Node.js 22
3. `npm ci` — install dependencies
4. `npm run build` — Astro builds static files to `dist/`
5. SFTP upload of `dist/` contents to Cloudways `/public_html` via `sshpass`
   - Also removes Cloudways' default `index.php` on first deploy

### Required GitHub Secrets
| Secret | Description |
|---|---|
| `CLOUDWAYS_HOST` | SFTP hostname |
| `CLOUDWAYS_USERNAME` | SFTP username |
| `CLOUDWAYS_PASSWORD` | SFTP password |

### Important notes
- The site is served as **static files** by nginx on Cloudways — no Node.js process runs
- POST requests to distilld.ca return `405 Not Allowed` from nginx (expected for a static host — the form posts to Brevo's `sibforms.com`, not the site itself)
- `.env` is gitignored — never committed

---

## Things to Complete

- [ ] Privacy Policy content (`/privacy`)
- [ ] Terms of Service content (`/terms`)
- [ ] Nav links: "App" and "Documentation" currently point to `#`
- [ ] Contact footer link points to `#`
- [ ] Dark mode toggle (button exists in nav but has no handler)
- [ ] Language toggle (button exists in nav but has no handler)
