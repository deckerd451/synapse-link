# Synapse Link

A cyberpunk‑themed professional networking platform for tech talents to connect,
collaborate and showcase their skills.  This fork refactors the original
implementation to store all user data in **Supabase** rather than Cloudflare
Durable Objects, making it easy to deploy on GitHub and other platforms.

> **Note**
>
> If you cloned the original repository, you may have seen a Cloudflare
> deployment button and comments in the configuration discouraging changes.
> Those were part of the template and are no longer relevant to this
> version.  Follow the instructions below to get up and running with a
> Supabase‑backed deployment.

## About The Project

Synapse Link is a visually striking, professional networking platform designed for the tech community, with a distinct cyberpunk aesthetic. It enables users to create detailed profiles showcasing their skills, interests, and availability. The core functionality revolves around a sophisticated matchmaking system that allows users to find collaborators or team members based on specific skills. Users can endorse each other's skills, send connection requests, and climb leaderboards. The platform also features a 'Synapse View,' an interactive network visualization that maps out the connections and skills within the community, providing a unique way to explore the ecosystem.

### Key Features

*   **Cyberpunk Aesthetic:** A dark, immersive UI with neon and gold accents for a unique user experience.
*   **Magic Link Authentication:** Secure, passwordless login using Supabase Auth.
*   **Advanced Profile Management:** Create detailed profiles with skills, interests, bio, and profile picture uploads.
*   **User Search & Matchmaking:** Find collaborators by name or specific skill sets.
*   **Skill Endorsements & Leaderboards:** Endorse skills for peers and climb the ranks on community leaderboards.
*   **Interactive Network Graph:** Visualize community connections and skills in the unique 'Synapse View'.

### Built With

*   **Frontend:**
    *   [React](https://reactjs.org/)
    *   [Vite](https://vitejs.dev/)
    *   [Tailwind CSS](https://tailwindcss.com/)
    *   [shadcn/ui](https://ui.shadcn.com/)
    *   [Zustand](https://github.com/pmndrs/zustand) for state management
*   **Backend:**
    *   [Hono](https://hono.dev/) running on a Cloudflare Worker or any Node.js runtime
*   **Database & Auth:**
    *   [Supabase](https://supabase.io/) (PostgreSQL + Auth)
*   **Deployment:**
    *   [GitHub Pages](https://pages.github.com/) for the static frontend
    *   [Cloudflare Workers](https://workers.cloudflare.com/) or a Node.js host for the API

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   [Bun](https://bun.sh/) installed on your machine.
*   An optional [Cloudflare account](https://dash.cloudflare.com/sign-up) if
    you intend to deploy the API portion as a Cloudflare Worker.  The
    frontend can be hosted anywhere (e.g. GitHub Pages) without a
    Cloudflare account.
*   A [Supabase account](https://supabase.com/dashboard) and a new project created.

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/synapse-link.git
    cd synapse-link
    ```

2.  **Install dependencies:**
    ```sh
    bun install
    ```

3.  **Set up Supabase:**
    *   In your Supabase project, navigate to the **SQL Editor** and execute the
        SQL script located at [`supabase/schema.sql`](./supabase/schema.sql).
        This will create the `profiles`, `connections` and `endorsements`
        tables used by the application.
    *   Go to **Project Settings → API** to find your Project URL and
        `anon` public key.

4.  **Configure Environment Variables:**
    *   Copy the file `.env` (provided in this repo) to `.env.local` and
        replace the example values with your own Supabase URL and anon key.  The
        variables prefixed with `VITE_` are exposed to the frontend at build
        time.
    *   If you plan to run the Cloudflare Worker locally using Wrangler,
        create a `.dev.vars` file in the root with the following contents:
        ```ini
        SUPABASE_URL="your-supabase-project-url"
        SUPABASE_ANON_KEY="your-supabase-anon-key"
        ```
        These variables are read by Wrangler when starting the API locally.

## Usage

Run the development server to spin up both the Vite frontend and the Hono
backend.  By default, the API is served locally via Wrangler on
`http://localhost:8787` and proxied through the Vite dev server.

```sh
bun run dev
```

Once the dev server is running you can visit `http://localhost:3000` to use
the app locally.  If you change any variables in your `.env.local` or
`.dev.vars` files, restart the server for the changes to take effect.

## Project Structure

*   `src/`: Contains the React frontend application code, including pages, components, and hooks.
*   `worker/`: Contains the Hono API that orchestrates calls to Supabase.
    This code can be deployed as a Cloudflare Worker or run under Node.js
    with a simple wrapper if you prefer another hosting provider.
*   `shared/`: TypeScript types shared between the frontend and backend.
*   `public/`: Static assets for the application.

## Deployment

Deployment consists of two parts: hosting the static frontend and hosting the API.  You can mix and match providers depending on your needs.

### Frontend (GitHub Pages)

The simplest way to publish the frontend is via GitHub Pages:

1.  Run a production build of the site:
    ```sh
    bun run build
    ```
    This outputs the static assets to the `dist/` directory.

2.  Commit the contents of `dist/` to a branch configured for GitHub Pages (e.g. `gh-pages`).  You can automate this with a GitHub Action or manually copy the files.

3.  Enable GitHub Pages in your repository settings and point it to the branch containing the build output.

### API (Cloudflare Worker or Node.js)

The `worker/` directory contains a Hono API that proxies and aggregates calls to Supabase.  You can deploy this code as a Cloudflare Worker or run it on any Node.js host.

#### Deploying to Cloudflare Workers

1.  **Configure Supabase Secrets:**
    If deploying via Cloudflare, add your Supabase credentials as secrets:
    ```sh
    npx wrangler secret put SUPABASE_URL
    npx wrangler secret put SUPABASE_ANON_KEY
    ```
    Wrangler will prompt you to enter the values.

2.  **Deploy the worker:**
    Use the deploy script to build the frontend and publish both the static
    assets and the API to Cloudflare Workers/Pages:
    ```sh
    bun run deploy
    ```

#### Running under Node.js

If you prefer to host the API yourself, you can wrap the Hono app in a small
Node.js server (e.g. using Express or the `http` module) and deploy it to
Vercel, Fly.io or any other Node host.  See the [Hono documentation](https://hono.dev/) for examples of running a Hono app on Node.