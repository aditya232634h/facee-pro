# Deployment guide (Atlas + Render + Vercel)

## 1. MongoDB Atlas
1. Create a cluster (free M0 is a replica set and supports transactions).
2. **Database Access** → add a user with *readWrite* on the `parkease` database only (not Atlas admin). Use a long random password; URL-encode special characters in the URI.
3. **Network Access** → Render's outbound IPs change, so the practical free-tier option is `0.0.0.0/0` protected by the strong password. For tighter control use a paid tier with static IPs/private networking.
4. Copy the connection string and add the DB name: `mongodb+srv://<user>:<password>@<cluster>/parkease?retryWrites=true&w=majority`.

## 2. Backend on Render
Push the repo to GitHub, then **New → Blueprint** (uses `render.yaml`) or create a Web Service manually:
root directory `server`, build `npm install`, start `npm start`, health check `/api/health`.
Environment variables: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` (long random; Blueprint generates one), `CLIENT_ORIGIN` (your Vercel URL, no trailing slash; comma-separate several).
Free instances sleep when idle, so the first request after a pause is slow.

## 3. First admin (production)
Do **not** run `npm run seed` against production (it creates demo accounts with documented passwords). Instead, from `server/` with the production `MONGODB_URI` in your shell:
```bash
ADMIN_EMAIL='you@example.com' ADMIN_PASSWORD='a-long-unique-password' ADMIN_NAME='Your Name' npm run create-admin
```
Then log in and create parking slots from **Admin → Parking slots**.

## 4. Frontend on Vercel
Import the repo, **Root Directory = `client`**, framework Vite (build `npm run build`, output `dist`). Set `VITE_API_BASE_URL=https://<your-service>.onrender.com/api` (optional `VITE_CONTACT_EMAIL`). `client/vercel.json` provides the SPA rewrite so deep links work. After the first deploy, put the Vercel URL into Render's `CLIENT_ORIGIN` and redeploy the API.

## 5. Post-deployment verification (do all, record the results)
- `GET https://<api>/api/health` → 200 and `"database":"connected"`.
- Open the Vercel URL; landing page shows live availability (not an error).
- Register a user, log in, find a slot, book it, view it under My bookings, cancel it.
- Log in as admin: Overview, Slots CRUD, Users, Reports, Database pages load.
- Try booking the same slot/time from two accounts: second must be rejected.

## Troubleshooting
| Symptom | Likely cause / fix |
|---|---|
| Browser console: CORS error | `CLIENT_ORIGIN` on Render doesn't exactly match the Vercel origin (scheme + host, no trailing `/`). |
| API crashes on start: `Missing required environment variable` | Set `MONGODB_URI` / `JWT_SECRET` in Render. |
| `MongoServerSelectionError` | Atlas Network Access blocks Render, wrong password/URL-encoding, or missing DB name in URI. |
| Booking returns 500 mentioning "Transaction numbers are only allowed on a replica set" | The DB is a standalone mongod; use Atlas or a local replica set. |
| Frontend calls hit Vercel (404) | `VITE_API_BASE_URL` not set at *build* time; set it and redeploy. |
| 429 Too many requests | Auth endpoints allow 30 attempts / 15 min per IP. |
