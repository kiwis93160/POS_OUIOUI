# OuiOui POS – Production Deployment Guide

This project is now configured to run against a real production stack composed of:

- **Netlify** serverless functions for all privileged business logic.
- **Supabase** as the primary database and storage layer.
- **Cloudinary** for media asset management (product photos, marketing images and receipts).

The former in-memory mock database has been removed. The front-end expects the backing services described below to be available.

## Prerequisites

- Node.js 18+
- An active Supabase project with the required tables (ingredients, products, recipes, orders, etc.).
- A Cloudinary account with an upload preset dedicated to this project.
- Netlify CLI (`npm install -g netlify-cli`) if you want to run the full stack locally.

## Configuration

1. Duplicate `.env.example` and rename it to `.env.local` (or `.env`) at the project root.
2. Fill in the variables:
   - `VITE_NETLIFY_FUNCTIONS_BASE`: usually `/.netlify/functions` in production. Override this if you proxy functions locally.
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: retrieved from your Supabase project settings.
   - `VITE_SUPABASE_SITE_ASSETS_TABLE`: optional table name that stores site asset key/value pairs. When defined, the UI will read directly from Supabase; otherwise it falls back to the Netlify function.
   - `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET`: used to build CDN URLs and prepare uploads.
3. Configure the same variables inside your Netlify site dashboard so that serverless functions have access to the Supabase service role keys and Cloudinary API credentials.

The `.env.example` file documents the required keys.

## Running Locally

```bash
npm install
npm run dev
```

If you also run your Netlify functions locally, use `netlify dev` so the Vite dev server and the functions proxy share the same origin.

## Deployment

The repository ships with a `netlify.toml` file that:

- Points Netlify to the `netlify/functions` directory.
- Uses `npm run build` to produce the Vite bundle into `dist/`.
- Bundles the Supabase client with Netlify functions through esbuild.

To deploy:

1. Push your code to a Git repository connected to Netlify.
2. Configure the environment variables mentioned above inside Netlify.
3. Trigger a deploy. Netlify will build the front-end and deploy your serverless API.

## Service Integration Overview

### Supabase

The file `services/supabaseClient.ts` initialises a Supabase client from the Vite environment. Read operations that can be performed with the anon key (for example, fetching marketing assets) use this client directly. Mutations and privileged queries are delegated to Netlify functions that should use Supabase service role keys.

### Cloudinary

The helper `services/cloudinary.ts` centralises the Cloudinary configuration. Product images, takeaway receipts and marketing assets are uploaded via Netlify functions that obtain signed upload URLs. The helper also exposes a utility to build CDN URLs for displaying images in the UI.

### Netlify Functions

All API calls originate from `services/apiService.ts`. The service targets `/.netlify/functions` (overridable via environment variable) and exposes operations for:

- Inventory management (ingredients, recipes, purchases).
- Menu management (products, categories, images).
- POS features (tables, on-site orders, takeaway orders, kitchen workflow).
- Staff management (role-based access, time tracking).
- Site content (marketing images stored on Supabase/Cloudinary).

Implement the corresponding Netlify functions in `netlify/functions/` so that they:

- Interact with Supabase for persistent data.
- Upload and fetch media from Cloudinary where required.
- Respect the endpoint structure used in `services/apiService.ts`.

## Next Steps

- Scaffold Netlify functions for each endpoint (`/data/*`, `/commandes/*`, `/products/*`, etc.).
- Secure the functions with authentication and role checks before exposing them publicly.
- Configure Supabase Row Level Security policies matching the POS roles defined in the UI.

With the above configuration in place the OuiOui POS front-end can run against production-grade infrastructure without relying on any mock data.
