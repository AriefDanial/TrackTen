# Database setup guide (TrackTen)

This guide walks you through setting up the database for TrackTen **step by step**.

---

## What you’re doing

1. **Create a `.env` file** – Tells the app where the database lives (a connection string).
2. **Create the database and tables** – Prisma reads `.env`, then creates the SQLite file and tables (e.g. `Staff`, `Attendance`).

---

## Step 1: Open the project folder

- Go to your TrackTen project folder, for example:
  - `C:\Users\User\OneDrive\Attachments\Desktop\TrackTen`
- You should see folders like `src`, `prisma` and files like `package.json`, `.env.example`.

---

## Step 2: Create the `.env` file

The `.env` file holds **environment variables** (secrets and config). Our app needs one variable: `DATABASE_URL`, so it knows where to create/use the database.

### Option A: Copy from `.env.example` (recommended)

1. In the **project root** (same folder as `package.json`), find the file **`.env.example`**.
2. **Copy** that file.
3. **Rename** the copy to **`.env`** (remove `.example`).
   - Result: you now have both `.env.example` and `.env` in the project root.

**Windows (File Explorer):**

- Right‑click `.env.example` → **Copy**.
- Right‑click in the same folder → **Paste**.
- Right‑click the copied file → **Rename** → change the name to `.env`.

**Windows (PowerShell in project folder):**

```powershell
cd "C:\Users\User\OneDrive\Attachments\Desktop\TrackTen"
Copy-Item .env.example .env
```

**Mac/Linux (Terminal):**

```bash
cp .env.example .env
```

### Option B: Create `.env` manually

1. In the project root, create a new file named **exactly** `.env` (no `.txt`).
   - In Windows, if you can’t create a file starting with a dot, create `env.txt` then rename it to `.env`, or use PowerShell/VS Code to create `.env`.
2. Open `.env` in a text editor and add this **single line**:

   ```
   DATABASE_URL="file:./dev.db"
   ```

3. Save the file.

### What this line means

- **`DATABASE_URL`** – Variable name the app and Prisma look for.
- **`file:./dev.db`** – “Use a SQLite database stored as a file named `dev.db` in the `prisma` folder.”
- After you run the next step, Prisma will create `prisma/dev.db` (and the tables inside it).

---

## Step 3: Install dependencies (if you haven’t already)

Open a terminal (PowerShell or Command Prompt) in the project folder and run:

```powershell
cd "C:\Users\User\OneDrive\Attachments\Desktop\TrackTen"
npm install
```

Wait until it finishes. This installs Next.js, Prisma, and everything else the project needs.

---

## Step 4: Create the database and tables

Still in the project folder, run:

```powershell
npx prisma db push
```

### What this does

1. **Reads** `prisma/schema.prisma` (your table definitions: `Staff`, `Attendance`).
2. **Reads** `DATABASE_URL` from `.env` (so it knows to use `prisma/dev.db`).
3. **Creates** the file `prisma/dev.db` if it doesn’t exist.
4. **Creates or updates** the tables to match the schema (no data is deleted by default).

### What you should see

If everything is OK, you’ll see something like:

```
Prisma schema loaded from prisma\schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./dev.db"

🚀  Your database is now in sync with your Prisma schema.
```

If you see an error:

- **“Environment variable not found: DATABASE_URL”**  
  → Your `.env` is missing or not in the project root. Check Step 2.

- **“Can’t reach database server”**  
  → You’re using a remote URL (e.g. PostgreSQL). For this guide we use `file:./dev.db`; make sure that’s what’s in `.env` for local setup.

---

## Step 5: Check that it worked

1. **Look for the database file**  
   In the `prisma` folder you should see **`dev.db`** (and maybe `dev.db-journal` while the app is running). That’s your SQLite database.

2. **Run the app and add sample data**  
   ```powershell
   npm run dev
   ```  
   Open [http://localhost:3000](http://localhost:3000). If there are no staff yet, click **“Add sample staff”**. That inserts rows into the `Staff` table and proves the database is working.

3. **Optional: open the database in a GUI**  
   Run:
   ```powershell
   npx prisma studio
   ```  
   A browser window opens where you can view and edit `Staff` and `Attendance` tables.

---

## Summary

| Step | What you did |
|------|------------------|
| 1    | Opened the project folder |
| 2    | Created `.env` in the project root with `DATABASE_URL="file:./dev.db"` |
| 3    | Ran `npm install` |
| 4    | Ran `npx prisma db push` to create `prisma/dev.db` and the tables |
| 5    | Verified with `npm run dev` and “Add sample staff” (and optionally `npx prisma studio`) |

After this, the database is set up and the app can store staff and attendance (including live time and location) in it.
