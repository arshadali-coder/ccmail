# CCMail - Modern Webmail Client

CCMail is a sleek, modern webmail application built with Next.js (App Router), styled with Tailwind CSS, and backed by Supabase and Resend.

## Features

- **Google-style Two-Step Login**: Dynamically verifies if an email exists in the database before requesting the password, with full support for browser password managers.
- **Onboarding Wizard**: A 3-step modal flow for new users to set their basic details (Name, Position, DOB, Recovery Email, and optional Signature).
- **Email Composition**: Support for composing and sending emails globally via the Resend API.
- **Drafts, Sent, Starred, and Trash Folder Management**: Fully-functioning folders synced in real-time.
- **Profile & Signature Customization**: View and edit your profile details and signature directly from the workspace.

---

## 🛠️ Database Setup (Supabase)

To get CCMail running, you need to set up a Supabase project.

1. Create a new Supabase project.
2. Go to the **SQL Editor** in your Supabase Dashboard.
3. Run the initial schema migration in [migrations/schema.sql](file:///migrations/schema.sql) to create the core tables:
   - `profiles`
   - `threads`
   - `messages`
   - `message_recipients`
   - `mailbox_entries`
   - `recovery_emails`
   - `recovery_email_otps`
4. Run the second migration in [migrations/schema_02.sql](file:///migrations/schema_02.sql) to add fields for user profiles (onboarding data like Position, DOB, Signature, and Onboarded status).

---

## 🔑 Environment Variables

Create a `.env` file in the root directory (this is automatically ignored by Git). Add the following variables:

```env
# Supabase Public Keys (used on both Client and Server)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Secret Keys (Server-side only)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend API Key (for sending emails)
RESEND_API_KEY=re_your_api_key_here
```

> [!IMPORTANT]
> When deploying to **Vercel**, ensure you configure all five environment variables in your Vercel Project Settings.

---

## 🚀 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Run the local utility to create a user in Supabase auth (since we use a custom email check login):
   ```bash
   node create-user.js your-email@codingcounciljmi.in password123 "Your Name"
   ```

---

## ☁️ Deploying to Vercel

1. Push your repository to **GitHub**.
2. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New > Project**.
3. Import your GitHub repository.
4. Expand the **Environment Variables** section and copy-paste the keys from your `.env` file.
5. Click **Deploy**. Vercel will automatically detect the Next.js app, compile it, and host it.
