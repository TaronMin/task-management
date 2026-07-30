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
