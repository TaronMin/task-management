# Task Board

A local Trello-style task management app: boards containing lists (columns) containing draggable cards.

- **Frontend**: React + TypeScript (Vite), react-router-dom for navigation, @dnd-kit for drag-and-drop.
- **Backend**: Plain Node.js + Express (CommonJS), no database — data is persisted to `server/data/db.json`.

## Setup

```
npm install
```

This installs dependencies for both `client/` and `server/` via npm workspaces.

## Run

```
npm run dev
```

Starts both servers concurrently:
- Client: http://localhost:5173
- API: http://localhost:4000/api

The Vite dev server proxies `/api` requests to the Express server, so the frontend always calls relative paths.

## Project structure

```
client/   React + TS app (Vite)
server/   Express API + JSON file persistence (server/data/db.json)
```

## API overview

| Method | Path                                   | Description                          |
|--------|-----------------------------------------|---------------------------------------|
| GET    | /api/boards                             | List boards                          |
| POST   | /api/boards                             | Create a board                       |
| GET    | /api/boards/:id                         | Board detail (board + lists + cards) |
| PUT    | /api/boards/:id                         | Rename a board                       |
| DELETE | /api/boards/:id                         | Delete a board (cascades)            |
| POST   | /api/boards/:boardId/lists               | Create a list                        |
| PUT    | /api/boards/:boardId/lists/reorder       | Persist new list order               |
| PUT    | /api/lists/:id                          | Rename a list                        |
| DELETE | /api/lists/:id                          | Delete a list (cascades)             |
| POST   | /api/lists/:listId/cards                 | Create a card                        |
| PUT    | /api/cards/:id                          | Update a card's fields               |
| DELETE | /api/cards/:id                          | Delete a card                        |
| PUT    | /api/cards/move                         | Move/reorder a card across lists     |

Data persists across restarts in `server/data/db.json`.

## Deployment

The frontend deploys to **GitHub Pages**, the backend deploys to **Render** (free web service). They're hosted separately since Pages only serves static files.

**Live URL**: https://taronmin.github.io/task-management/

### Backend (Render)

1. On [Render](https://render.com), create a new **Blueprint** and point it at this repo — it picks up `render.yaml` automatically (root dir `server/`, `npm install` / `npm start`, free plan).
   - Alternatively: New → Web Service → root directory `server`, build command `npm install`, start command `npm start`.
2. Once deployed, copy the service URL (e.g. `https://task-management-api.onrender.com`).
3. Note: the free plan's disk is ephemeral and the service sleeps after inactivity — `db.json` resets on redeploy/restart, and the first request after idling is slow. Fine for a demo, not for real data.

### Frontend (GitHub Pages)

Deploys automatically via `.github/workflows/deploy.yml` on every push to `master`.

The build needs to know the backend's URL. Set it once as a repository variable:

```
gh variable set VITE_API_URL --body "https://<your-render-service>.onrender.com/api"
```

(Settings → Secrets and variables → Actions → Variables also works.) Then re-run the workflow (push a commit, or `gh workflow run deploy.yml`).

CORS on the backend already allows `https://taronmin.github.io` — update `ALLOWED_ORIGINS` in `server/src/index.js` if the Pages URL ever changes.
