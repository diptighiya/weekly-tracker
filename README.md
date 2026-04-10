# Weekly Tracker

A full-stack weekly task tracker built with React + Vite + Supabase + Tailwind CSS.

## Features

- Weekly Kanban board (To Do / In Progress / Done)
- LeetCode streak tracking (auto-increments on LeetCode ticket completion)
- File attachments per ticket via Supabase Storage
- New Week navigation (preserves streak)
- Dark mode support
- Email/password authentication

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/diptighiya/weekly-tracker.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com), import the GitHub repo.

3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. Deploy.

## Supabase Storage Setup

Run this SQL in the Supabase SQL editor:

```sql
insert into storage.buckets (id, name, public)
values ('ticket-attachments', 'ticket-attachments', false);

create policy "Users can manage their own attachments"
on storage.objects for all
using (auth.uid()::text = (storage.foldername(name))[1]);
```
