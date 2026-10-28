# ReelTrack — Movie Watchlist Manager

A cinematic MERN-stack dashboard for tracking every film you want to see, are watching, or have already watched. Features priority-based recommendations, a strict status workflow, ratings, live statistics, genre/status filters, case-insensitive search, and paginated results.

---

## Screenshots

> Add two screenshots of your running app to the `docs/` folder, then uncomment the lines below.

<!-- ![Watchlist dashboard](docs/watchlist-dashboard.png) -->
<!-- ![Add movie form](docs/add-movie-form.png) -->

---

## Tech stack

| Layer    | Technology                                |
|----------|-------------------------------------------|
| Frontend | React 18 + Vite, Lucide React icons       |
| Backend  | Node.js, Express 4, Mongoose 8            |
| Database | MongoDB Atlas (cloud) or local MongoDB    |

---

## Project layout

```
movie-watchlist-manager/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Movie.js       # Mongoose schema with all validations
│   │   │   └── Sequence.js    # Per-year atomic counter for movie codes
│   │   ├── routes/
│   │   │   └── movieRoutes.js # All /api/movies/* Express routes
│   │   ├── utils/
│   │   │   └── movieCode.js   # Generates MV-YEAR-### codes atomically
│   │   └── server.js          # Express app: CORS, JSON, error handler
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MovieCard.jsx   # Individual film card
│   │   │   ├── MovieForm.jsx   # Add / edit modal
│   │   │   ├── Spotlight.jsx   # Watch Next banner
│   │   │   ├── StatsGrid.jsx   # Four stat tiles
│   │   │   └── StatusEditor.jsx# Status / rating update modal
│   │   ├── api.js              # All fetch calls in one place
│   │   ├── constants.js        # GENRES, PLATFORMS, STATUSES, etc.
│   │   ├── App.jsx             # Root component
│   │   ├── main.jsx
│   │   └── styles.css          # Full cinematic dark design system
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── docs/                       # Place your screenshots here
├── .gitignore
└── README.md
```

---

## Local setup

### Prerequisites
- Node.js ≥ 18
- A [MongoDB Atlas](https://www.mongodb.com/atlas) free-tier cluster **or** a local MongoDB instance

### 1. Clone & enter the project

```bash
git clone <your-repo-url>
cd movie-watchlist-manager
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and set your real MongoDB Atlas URI:

```env
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.xxxxx.mongodb.net/movie_watchlist?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:5173
```

Start the API server:

```bash
npm run dev      # nodemon — auto-restarts on file changes
# or
npm start        # plain node
```

The API is available at `http://localhost:5000/api`.

### 3. Frontend

Open a **second terminal**:

```bash
cd frontend
npm install
cp .env.example .env
```

The default `.env` already points to the local backend:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

---

## Environment variables

### Backend (`backend/.env`)

| Variable        | Required | Description                                                         |
|-----------------|----------|---------------------------------------------------------------------|
| `MONGODB_URI`   | ✅       | Full MongoDB connection string                                       |
| `PORT`          | No       | Port for the Express server (default `5000`)                        |
| `CLIENT_ORIGIN` | No       | Allowed CORS origin (default `http://localhost:5173`)               |

### Frontend (`frontend/.env`)

| Variable       | Required | Description                                          |
|----------------|----------|------------------------------------------------------|
| `VITE_API_URL` | No       | Base URL for API calls (default `http://localhost:5000/api`) |

---

## API reference

All responses follow `{ success: boolean, message: string, data: any }`.

| Method | Endpoint                    | Description                                                                 | Success |
|--------|-----------------------------|-----------------------------------------------------------------------------|---------|
| GET    | `/api/health`               | Liveness check                                                              | 200     |
| GET    | `/api/movies`               | Paginated movie list. Query params: `page`, `status`, `genre`, `search`     | 200     |
| GET    | `/api/movies/stats`         | Status counts, total hours watched, average rating, top watched genre       | 200     |
| GET    | `/api/movies/watch-next`    | Highest-priority "To Watch" movie; shortest runtime as tie-breaker          | 200/404 |
| GET    | `/api/movies/:id`           | Single movie by MongoDB ObjectId                                            | 200/404 |
| POST   | `/api/movies`               | Add a movie; server generates movie code                                    | 201     |
| PUT    | `/api/movies/:id`           | Edit `title`, `genre`, `runtime`, `platform`, `priority` only              | 200     |
| PATCH  | `/api/movies/:id/status`    | Advance status (workflow enforced). Rating required when moving to Watched  | 200     |
| PATCH  | `/api/movies/:id/rating`    | Update rating for a Watched movie                                           | 200     |
| DELETE | `/api/movies/:id`           | Delete — blocked if status is "Watching"                                    | 200/400 |

### Status workflow

```
To Watch ──► Watching ──► Watched (final)
To Watch ──────────────► Watched (requires rating)
Watching ──────────────► To Watch
```

### List query parameters

| Param    | Values                                       |
|----------|----------------------------------------------|
| `page`   | integer ≥ 1, default 1                       |
| `status` | `To Watch` · `Watching` · `Watched`          |
| `genre`  | `Action` · `Comedy` · `Drama` · `Horror` · `Sci-Fi` · `Romance` · `Thriller` |
| `search` | Case-insensitive substring of title          |

Response `data` shape for the list:
```json
{
  "movies": [...],
  "page": 1,
  "limit": 6,
  "totalMovies": 42,
  "totalPages": 7
}
```

---

## Business rules

1. **Movie codes** are generated server-side as `MV-<year>-<3-digit-sequence>` using a per-year atomic MongoDB counter. The first movie for 2024 is `MV-2024-001`. Codes cannot be set or changed by the client.
2. **Release year** must be between 1950 and the current year.
3. **Runtime** must be between 30 and 300 minutes.
4. **Priority** is 1–5 (1 = whenever, 5 = must watch).
5. **Duplicate titles** for the same release year are rejected with HTTP 409. Comparison is case-insensitive.
6. **Watched status is final.** A `Watched` movie's status cannot change. Moving to `Watched` requires an integer rating from 1–10; the watched date is set by the server.
7. **Rating edits** are only allowed on `Watched` movies.
8. **Watching movies cannot be deleted.** The delete button is disabled in the UI and the server returns 400.
9. **Statistics** are calculated live from MongoDB after every mutation.

---

## Validation rules

| Field        | Rule                                      |
|--------------|-------------------------------------------|
| Title        | Required, trimmed, max 120 chars          |
| Genre        | Enum: Action, Comedy, Drama, Horror, Sci-Fi, Romance, Thriller |
| Release year | Integer 1950 – current year (immutable)  |
| Runtime      | Integer 30 – 300 minutes                 |
| Platform     | Enum: Netflix, Prime Video, Hotstar, Theatre, Other |
| Priority     | Integer 1 – 5                            |
| Rating       | Integer 1 – 10 (only for Watched movies) |

---

## Running both servers concurrently

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

No concurrency package is needed; two terminals is clear and avoids hidden failures.

---

## Build for production

```bash
# Build the React app
cd frontend && npm run build
# Output is in frontend/dist/ — serve it as a static site
```

---

## Deploying to Render + MongoDB Atlas

### Step 1 — MongoDB Atlas
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a database user with read/write access.
3. Allow network access from `0.0.0.0/0` (or restrict to Render's IP ranges).
4. Copy the connection string.

### Step 2 — Deploy the backend on Render
1. Push your code to GitHub (make sure `.env` is in `.gitignore`).
2. On [render.com](https://render.com), create a **Web Service**.
3. Connect your GitHub repo and set the **Root Directory** to `backend`.
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables in the Render dashboard:
   - `MONGODB_URI` — your Atlas connection string
   - `CLIENT_ORIGIN` — your frontend's public URL (add after the next step)
   - `NODE_ENV` — `production`
7. Deploy and copy the backend service URL (e.g. `https://reeltrack-api.onrender.com`).

### Step 3 — Deploy the frontend on Render
1. Create a **Static Site** on Render.
2. Connect the same repo, set **Root Directory** to `frontend`.
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add environment variable: `VITE_API_URL=https://reeltrack-api.onrender.com/api`
6. Deploy and copy the frontend URL.

### Step 4 — Update CORS
1. Go back to your backend Render service.
2. Update `CLIENT_ORIGIN` to the frontend URL from Step 3.
3. Redeploy the backend.

### Step 5 — Smoke test after deployment
- Add a movie, confirm movie code is generated.
- Check filters, search, pagination.
- Advance status to Watching, then Watched (with rating).
- Verify statistics update.
- Confirm delete is blocked for Watching movies.
- Test Watch Next.

---

## What requires a MongoDB Atlas connection

The following features **need a live database** and cannot be verified without `MONGODB_URI` set to a reachable cluster:

- Add / edit / delete movie (POST, PUT, DELETE)
- Status transitions and rating updates
- Watch Next (`GET /api/movies/watch-next`)
- Statistics (`GET /api/movies/stats`)
- Pagination, filters, and search
- Movie code sequence generation

**Without a database**, the server exits at startup with:
```
MongoDB connection failed: ...
```

---

## GitHub submission checklist

- [ ] `backend/.env` is listed in `.gitignore` (it is)
- [ ] `frontend/.env` is listed in `.gitignore` (it is)
- [ ] `.env.example` files use placeholder values only
- [ ] Two screenshots added to `docs/` and referenced in this README
- [ ] Meaningful commits throughout development
- [ ] No real passwords, API keys, or secrets in any committed file
