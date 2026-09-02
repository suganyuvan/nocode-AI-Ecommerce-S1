# Deploying to Dokploy

This guide outlines how to deploy **Swarna Wooden Crafts (IrisJev)** to your self-hosted **Dokploy** instance using Docker.

---

## 🏗️ Architecture Overview

- **Build Stage**: Node.js 20 Alpine compiles TypeScript, generates fresh XML sitemaps/robots.txt, and bundles minified Vite production assets into `/app/dist`.
- **Production Stage**: Lightweight Nginx Alpine server (`~25MB` final image) with:
  - SPA fallback routing (`try_files $uri $uri/ /index.html;`) so React Router paths work without 404s.
  - Gzip compression on all static assets.
  - Immutable 1-year caching for `/assets/` and immediate revalidation for `/sitemap.xml`, `/robots.txt`, and `/llms.txt`.
  - Native healthcheck at `/healthz`.

---

## 🚀 Deployment Steps in Dokploy

### Step 1: Create a New Application in Dokploy
1. Open your Dokploy Dashboard.
2. Select your **Project** and click **Create Service** -> **Application**.
3. Choose your Git Provider (**GitHub**, **GitLab**, or **Raw Git repository**).
4. Select the repository and the branch (e.g. `main`).

---

### Step 2: Configure Build Type

You can deploy using either **Dockerfile** (Recommended) or **Docker Compose**:

#### Option A: Dockerfile (Recommended)
- **Build Type**: `Dockerfile`
- **Dockerfile Path**: `./Dockerfile`
- **Context Path**: `.`

#### Option B: Docker Compose
- **Build Type**: `Docker Compose`
- **Compose Path**: `./docker-compose.yml`

---

### Step 3: Set Environment Variables (Build Arguments)

In Dokploy, open the **Environment** tab of your application and add the following variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
VITE_RESEND_API_KEY=re_your_resend_api_key_here
VITE_ADMIN_NOTIFICATION_EMAIL=admin@yourdomain.com
VITE_RESEND_SENDER_EMAIL=send@yourdomain.com
VITE_SITE_URL=https://swarnawoodencrafts.com
```

> [!IMPORTANT]
> Because Vite embeds environment variables prefixed with `VITE_` at build time, Dokploy passes these into the Docker build arguments defined in the `Dockerfile`.

---

### Step 4: Configure Domain & SSL
1. Go to the **Domains** tab in your Dokploy application.
2. Click **Add Domain**.
3. Enter your domain (e.g. `swarnawoodencrafts.com` or `store.irisjev.com`).
4. Set the **Container Port** to `80`.
5. Enable **HTTPS / Let's Encrypt** for automated free SSL certificates.

---

### Step 5: Configure Health Check (Optional)
Dokploy automatically uses the Docker `HEALTHCHECK` directive embedded in the Dockerfile:
- **Path**: `/healthz`
- **Port**: `80`
- **Expected Response**: `200 OK`

---

### Step 6: Deploy
Click **Deploy** in Dokploy. Dokploy will clone the repository, run the multi-stage build, generate the sitemaps, start the container, and route HTTPS traffic through Traefik.

---

## 🛠️ Local Docker Testing (Optional)

To test the container locally on any machine with Docker installed:

```bash
# Build the image with local environment variables
docker build \
  --build-arg VITE_SUPABASE_URL="https://kimkttzdxnkekcoeuvop.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="your-anon-key" \
  --build-arg VITE_SITE_URL="https://swarnawoodencrafts.com" \
  -t swarna-storefront .

# Run container on port 3000
docker run -p 3000:80 swarna-storefront

# Test health check
curl http://localhost:3000/healthz
```

Or using Docker Compose:

```bash
docker compose up --build -d
```
