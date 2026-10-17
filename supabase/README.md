# Scholaria - Supabase Backend Deployment Guide

This folder contains the complete SQL schema and configurations needed to connect **Scholaria** to a production Supabase instance.

## Architecture Highlights
- **PostgreSQL 15+** with `uuid-ossp` and `pgcrypto`
- **Full Row-Level Security (RLS)** protecting private reading progress, bookmarks, notifications, and administrative moderation
- **Strict Role-Based Access Control (RBAC)**: `student`, `educator`, `scholar`, and `admin`
- **Zero Plain-Text Passwords**: Leverages Supabase Auth (`auth.users`)
- **Automated `updated_at` Triggers**

## Quick Setup Steps

1. **Create a Supabase Project**:
   - Go to [https://supabase.com](https://supabase.com) and create a new project.
   - Choose your preferred region.

2. **Execute Schema**:
   - Navigate to the **SQL Editor** in your Supabase dashboard.
   - Open `supabase/schema.sql` from this repository.
   - Paste the SQL script and click **Run**.

3. **Configure Storage Buckets**:
   - In Supabase Storage, create two public buckets:
     - `book-covers`: For book cover art
     - `post-attachments`: For research diagrams and post images
   - Set upload limits to 5MB and allowed mime types (`image/jpeg`, `image/png`, `image/webp`).

4. **Connect Environment Variables**:
   In your client application, set:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
