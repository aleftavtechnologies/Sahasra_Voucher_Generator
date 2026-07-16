# Sahasra Voucher Portal — Deploy with GitHub + Vercel (now with Send Email)

## What this is

A web page (`index.html`) where an officer fills in voucher details, and can either:
- **Download** the PDF (matches your original template exactly, logo included), or
- **Send** it by email — one click, PDF genuinely attached, no popup, no manual attach step.

The download path is 100% client-side (nothing leaves the browser). The send path uses
one small serverless function (`api/send-voucher.js`) that relays the email through your
Zoho SMTP account — still entirely on Vercel's free tier, no separate server.

---

## Step 1 — Push to GitHub

```bash
cd sahasra-voucher-portal
git init
git add .
git commit -m "Sahasra voucher portal with email sending"
git remote add origin https://github.com/your-org/sahasra-voucher-portal.git
git branch -M main
git push -u origin main
```

(If you already have this repo from before, just commit and push the changes instead.)

---

## Step 2 — Import into Vercel

1. [vercel.com](https://vercel.com) → sign in with GitHub (free) → **Add New → Project**.
2. Select the repo. Framework Preset: **Other**.
3. Vercel automatically detects `api/send-voucher.js` as a Serverless Function — no extra config needed.
4. **Before** clicking Deploy (or right after, then redeploy), add the environment variables in Step 3.

---

## Step 3 — Environment variables (Zoho SMTP credentials)

In the Vercel project → **Settings → Environment Variables**, add:

| Key | Value |
|---|---|
| `ZOHO_SMTP_HOST` | `smtp.zoho.com` |
| `ZOHO_SMTP_PORT` | `465` |
| `ZOHO_SMTP_USER` | `hiceylon@sahasra.world` |
| `ZOHO_SMTP_PASS` | *(Zoho app-specific password — see below)* |
| `ZOHO_FROM_NAME` | `Sahasra Holidays (Pvt) Ltd` |
| `ZOHO_FROM_EMAIL` | `hiceylon@sahasra.world` |
| `ZOHO_REPLY_TO` | `dimuthu@sahasra.world` |
| `API_KEY` | *(any random string — generate one, see below)* |

**Getting the Zoho app password:** Zoho Mail → Settings → Security → App Passwords →
generate one named "Sahasra Voucher Portal". Use that, not your normal login password.

**Generating `API_KEY`:** any random string works, e.g. run `openssl rand -hex 24` in a
terminal, or just mash the keyboard. This is a lightweight shared secret between your
frontend and your own API endpoint — it stops random bots from finding the endpoint and
spamming emails through your Zoho account. It is **not strong security** (see Step 4),
but it's a reasonable deterrent for an internal tool.

After adding these, redeploy (Vercel → Deployments → ⋯ → Redeploy) so the function picks them up.

---

## Step 4 — Match the API key in the frontend

Open `index.html`, find this line near the top of the `<script>` section:

```js
const SEND_API_KEY = 'CHANGE_ME_TO_MATCH_VERCEL_ENV_API_KEY';
```

Replace the placeholder with the exact same value you set as `API_KEY` in Vercel's
environment variables. Commit and push — Vercel redeploys automatically.

**Be aware:** because this is a static page with no build step, this key is visible to
anyone who views the page source. That's an inherent limit of a pure frontend-only setup,
not a bug in this code. For an internal tool only your officers know the URL of, this is
a reasonable tradeoff. If this ever needs to be genuinely secure (e.g. the URL becomes
public), the fix is adding real authentication (e.g. a login step) in front of the send
button — happy to build that if it becomes relevant.

---

## Step 5 — Test it

Once deployed with real credentials:
1. Open your live Vercel URL.
2. Fill in a voucher.
3. Enter a **real email address you can check** in "Send To".
4. Click **Send Email with PDF Attached**.
5. Check that inbox — you should get the email, from Sahasra Holidays, with the voucher PDF attached.

If it fails, the status message will show the error (e.g. wrong Zoho password, or a
missing env var) — check Vercel → your project → **Deployments → Functions → Logs** for
the full error if the on-page message isn't enough.

---

## Notes

- **Zoho sending limits**: standard Zoho Mail plans cap outbound emails per day. Fine for
  voucher-per-booking volume.
- **Vercel free tier**: this function runs for a couple of seconds per send (SMTP
  round-trip), comfortably within Hobby plan limits.
- **Download still works independently** — officers can still just download without
  sending, same as before.
