# SMU SoundFoundry Vday Merch Sales

A custom-made order system built for SMU Soundfoundry for their Valentine's Day Concert merch sales (2026). It allows students to place orders via a web interface, stores data securely in Supabase, and automatically syncs all orders in real-time to a Google Sheet for the logistics team.

*Disclaimer: This was developed in 3 days with heavy use of AI (Gemini).*

## 🚀 Features
- **Order Management:** Students can select products, customize options (e.g., flower colors), and upload payment proof.
- **Real-time Sync:** All orders are instantly "pushed" to a shared Google Sheet via Supabase Database Triggers.
- **Secure Storage:** Payment screenshots are stored safely using Supabase Storage with Row Level Security (RLS).
- **Concurrency Handling:** Google Apps Script utilizes LockService to handle multiple simultaneous orders without data loss.

## 🛠 Tech Stack
- **Frontend:** Vue.js, Bootstrap, Vercel for hosting
- **Backend & Database:** Supabase (Database, Session, Storage)
- **Integration:** Google Apps Script (Google Sheet Integration)
- **Extensions:** pg_net (PostgreSQL Network Extension)

## 🛡 Security Note
- **RLS Policies:** Row Level Security is enabled on the orders table. The SQL Trigger uses security definer to securely bypass this ONLY for the purpose of exporting to Google Sheets.
- **Secret Keys:** No API keys are exposed in the frontend or the Google Script.