# PostgreSQL Database Setup Guide

## Option 1: Install PostgreSQL Locally (Recommended for Development)

### Step 1: Download and Install PostgreSQL

1. **Download PostgreSQL:**
   - Go to https://www.postgresql.org/download/windows/
   - Download the PostgreSQL installer (recommended: latest version)
   - Run the installer

2. **During Installation:**
   - Choose installation directory (default is fine)
   - **IMPORTANT:** When prompted, set a password for the `postgres` superuser account
     - Remember this password! You'll need it for the DATABASE_URL
     - Example: `mypostgrespassword123`
   - Port: Keep default `5432`
   - Locale: Default is fine

3. **After Installation:**
   - PostgreSQL should be running as a Windows service
   - You can verify in Services (services.msc) - look for "postgresql-x64-XX"

### Step 2: Create Your Database

Open **pgAdmin** (installed with PostgreSQL) or use **psql** command line:

#### Using pgAdmin (GUI - Easier):

1. Open **pgAdmin 4** from Start Menu
2. Connect to server (use the password you set during installation)
3. Right-click on "Databases" → "Create" → "Database"
4. Name: `taskflow_db`
5. Owner: `postgres` (or your username)
6. Click "Save"

#### Using Command Line (psql):

1. Open **Command Prompt** or **PowerShell**
2. Navigate to PostgreSQL bin directory (usually):
   ```powershell
   cd "C:\Program Files\PostgreSQL\16\bin"
   ```
   (Replace `16` with your PostgreSQL version)

3. Connect to PostgreSQL:
   ```powershell
   .\psql.exe -U postgres
   ```
   Enter your password when prompted

4. Create the database:
   ```sql
   CREATE DATABASE taskflow_db;
   ```

5. Exit psql:
   ```sql
   \q
   ```

### Step 3: Get Your Connection String

Your `DATABASE_URL` will be in this format:

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

**Example:**
```
postgresql://postgres:mypostgrespassword123@localhost:5432/taskflow_db
```

Where:
- `postgres` = username (default superuser)
- `mypostgrespassword123` = the password you set during installation
- `localhost` = host (use `localhost` for local development)
- `5432` = port (default PostgreSQL port)
- `taskflow_db` = your database name

---

## Option 2: Use Docker (Alternative)

If you have Docker installed:

```bash
docker run --name taskflow-postgres -e POSTGRES_PASSWORD=mypassword -e POSTGRES_DB=taskflow_db -p 5432:5432 -d postgres
```

Then your DATABASE_URL would be:
```
postgresql://postgres:mypassword@localhost:5432/taskflow_db
```

---

## Option 3: Use a Cloud Database (Production)

### Free Options:
- **Supabase** (https://supabase.com) - Free tier available
- **Neon** (https://neon.tech) - Serverless PostgreSQL
- **Railway** (https://railway.app) - Free tier available
- **Render** (https://render.com) - Free tier available

They provide connection strings directly in their dashboards.

---

## Setting Up Your .env.local File

Create a `.env.local` file in your project root:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/taskflow_db"

# NextAuth Secret
NEXTAUTH_SECRET="2ggnE2/rZTUgQP17mZudiECT2Oas90AzmYk15m5MgRg="
AUTH_SECRET="2ggnE2/rZTUgQP17mZudiECT2Oas90AzmYk15m5MgRg="

# NextAuth URL
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

**Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.**

---

## After Setup: Run Migrations

Once your database is set up and `.env.local` is configured:

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations to create tables
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed
```

---

## Troubleshooting

### Can't connect to database?
- Check if PostgreSQL service is running: `services.msc` → look for PostgreSQL service
- Verify password is correct
- Check if port 5432 is not blocked by firewall

### Forgot PostgreSQL password?
- You can reset it using pgAdmin or by editing `pg_hba.conf` file
- Or reinstall PostgreSQL (will lose existing data)

### Connection refused?
- Make sure PostgreSQL is running
- Check if port 5432 is correct
- Try `localhost` instead of `127.0.0.1`

