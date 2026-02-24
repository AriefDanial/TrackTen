# Deploy TrackTen to Vercel

Follow these steps to deploy TrackTen on the internet. You’ll use **Vercel** for the app and **Neon** (free tier) for the database.

**Quick order:** 1 → 2 → 3 → 4 → 5 → 6 (then add staff from Admin after first deploy).

---

## 1. Create a PostgreSQL database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up (free).
2. Create a new project (e.g. **TrackTen**).
3. Copy the **connection string** (PostgreSQL URL). It looks like:
   ```txt
   postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep this URL safe; you’ll add it to Vercel as `DATABASE_URL`.

---

## 2. Switch Prisma to PostgreSQL

TrackTen uses SQLite locally. For Vercel you must use PostgreSQL.

1. Open **`prisma/schema.prisma`**.
2. Change the datasource from:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   to:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Save the file.

*(If you want to use SQLite again locally, change it back to `provider = "sqlite"` and use `DATABASE_URL="file:./dev.db"` in `.env`.)*

---

## 3. Push the schema to the production database

From your project folder, run (use your **Neon** URL from step 1):

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
npx prisma db push
```

**macOS / Linux:**
```bash
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require" npx prisma db push
```

This creates the tables (Staff, Attendance, Application) in your Neon database.

---

## 4. Push your code to GitHub

1. Create a new repository on [GitHub](https://github.com/new).
2. In your project folder, run:

   ```bash
   git init
   git add .
   git commit -m "TrackTen initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name.

---

## 5. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. Click **Add New…** → **Project**.
3. Import your GitHub repo (TrackTen). Click **Import**.
4. **Environment variables** — Add these (before deploying):

   | Name               | Value                    | Notes                          |
   |--------------------|--------------------------|--------------------------------|
   | `DATABASE_URL`     | Your Neon connection URL | From step 1                    |
   | `ADMIN_PASSWORD`   | A strong password        | For admin login; **required**  |
   | `STAFF_SESSION_SECRET` | Optional; random string  | If not set, uses `ADMIN_PASSWORD` |

5. Click **Deploy**. Vercel will run `prisma generate` and `next build` (from your `package.json`).

---

## 6. After the first deploy

1. Open your Vercel URL (e.g. `https://trackten-xxx.vercel.app`).
2. You’ll be redirected to **/login**. Click **Log in as admin** (or go to `/login?mode=admin`).
3. Sign in with the **ADMIN_PASSWORD** you set in Vercel.
4. Go to **Staff** and add staff (with passwords) or use **Seed 3 sample staff** so people can log in as staff and use the app.

---

## Checklist

- [ ] Neon project created and connection string copied
- [ ] `prisma/schema.prisma` set to `provider = "postgresql"`
- [ ] `npx prisma db push` run with production `DATABASE_URL`
- [ ] Code pushed to GitHub
- [ ] Vercel project created and repo imported
- [ ] `DATABASE_URL` and `ADMIN_PASSWORD` set in Vercel
- [ ] Deploy successful; admin and staff can log in

---

## HTTPS and geolocation

Vercel gives you **HTTPS** by default. Browsers usually allow **Geolocation** only on secure origins, so clock-in/out with location will work on your deployed URL.

## Troubleshooting

- **Build fails**: Ensure `prisma/schema.prisma` uses `provider = "postgresql"` and that `DATABASE_URL` in Vercel is a valid Postgres URL.
- **“Failed to create account” or DB errors**: Run `npx prisma db push` again with the same `DATABASE_URL` as in Vercel.
- **Admin login not working**: Set `ADMIN_PASSWORD` in Vercel (no dev fallback in production).
- **Staff can’t log in**: Add staff (with passwords) from Admin → Staff after deploy; or run the seed and use password `password123` for the sample users.
