# Deployment Guide — Compiler Memory Visualizer

This guide provides step-by-step instructions for deploying the project to **Vercel** and **Render**.

---

## 1. Deploy Frontend to Vercel (Recommended — Free & Fast)

The frontend is a client-side Single Page Application (SPA) built with Vite, React, and Tailwind CSS. All compiler simulations and memory visualizations run in the browser.

### Step 1: Push your Code to GitHub
Open your terminal inside the project directory:

```bash
git init
git add .
git commit -m "Deploy Compiler Memory Visualizer"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/compiler-memory-visualizer.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **"Add New..." ➔ "Project"**.
3. Select your `compiler-memory-visualizer` repository and click **Import**.
4. Vercel will automatically detect:
   - **Framework Preset**: `Vite`
   - **Build Command**: `vite build` (or `npm run build`)
   - **Output Directory**: `dist`
5. Click **Deploy**.
6. In ~60 seconds, your site will be live at:
   `https://compiler-memory-visualizer.vercel.app`

*(Note: [`vercel.json`](./vercel.json) is already included in this repository to handle SPA routing redirects.)*

---

## 2. Deploy to Render (render.com)

Render allows you to host both the **Frontend** as a static site and the **Backend** (real `g++` compilation service) as a Docker container.

### Option A: 1-Click Blueprint (Easiest)
This repository includes a [`render.yaml`](./render.yaml) file.
1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Click **"New +" ➔ "Blueprint"**.
3. Connect your GitHub repository.
4. Render will automatically read `render.yaml` and configure:
   - **Frontend Static Site**: `dist/` directory, SPA rewrite rule.
   - **Backend Web Service**: Dockerfile with `g++` pre-installed on port 5000.
5. Click **Apply**. Both services will deploy automatically!

---

### Option B: Manual Setup on Render

#### Deploy Frontend (Static Site):
1. On Render, click **"New +" ➔ "Static Site"**.
2. Connect your GitHub repo.
3. Configure:
   - **Name**: `compiler-memory-visualizer`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Redirects/Rewrites**, add:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
5. Click **Create Static Site**.

#### Deploy Backend (Docker Web Service with g++):
If you want server-side execution with real native `g++`:
1. On Render, click **"New +" ➔ "Web Service"**.
2. Connect your GitHub repo.
3. Configure:
   - **Name**: `compiler-api`
   - **Root Directory**: `server`
   - **Environment**: `Docker` (Render automatically uses `server/Dockerfile`)
   - **Plan**: `Free`
4. Click **Create Web Service**.
5. Once deployed, Render provides a URL (e.g. `https://compiler-api.onrender.com`).

---

## 3. Linking Frontend to Live Backend (Optional)

If using the backend C++ runner service, set your environment variable:

1. In Vercel or Render project settings, go to **Environment Variables**.
2. Add:
   - **Key**: `VITE_BACKEND_URL`
   - **Value**: `https://your-backend-service.onrender.com`
3. Trigger a redeploy.
