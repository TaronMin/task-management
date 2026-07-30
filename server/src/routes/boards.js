const express = require('express');
const crypto = require('crypto');
const { readDb, writeDb } = require('../store');

const router = express.Router();

router.get('/', async (req, res) => {
  const db = await readDb();
  res.json(db.boards);
});

router.post('/', async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const now = new Date().toISOString();
  const board = { id: crypto.randomUUID(), title: title.trim(), createdAt: now, updatedAt: now };

  const db = await readDb();
  db.boards.push(board);
  await writeDb(db);
  res.status(201).json(board);
});

router.get('/:id', async (req, res) => {
  const db = await readDb();
  const board = db.boards.find((b) => b.id === req.params.id);
  if (!board) return res.status(404).json({ error: 'board not found' });

  const lists = db.lists
    .filter((l) => l.boardId === board.id)
    .sort((a, b) => a.order - b.order);
  const listIds = new Set(lists.map((l) => l.id));
  const cards = db.cards
    .filter((c) => listIds.has(c.listId))
    .sort((a, b) => a.order - b.order);

  res.json({ board, lists, cards });
});

router.put('/:id', async (req, res) => {
  const { title } = req.body;
  const db = await readDb();
  const board = db.boards.find((b) => b.id === req.params.id);
  if (!board) return res.status(404).json({ error: 'board not found' });

  if (typeof title === 'string') {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return res.status(400).json({ error: 'title cannot be empty' });
    board.title = trimmedTitle;
  } else if (title !== undefined) {
    return res.status(400).json({ error: 'title must be a string' });
  }
  board.updatedAt = new Date().toISOString();
  await writeDb(db);
  res.json(board);
});

router.delete('/:id', async (req, res) => {
  const db = await readDb();
  const board = db.boards.find((b) => b.id === req.params.id);
  if (!board) return res.status(404).json({ error: 'board not found' });

  const listIds = new Set(db.lists.filter((l) => l.boardId === board.id).map((l) => l.id));
  db.boards = db.boards.filter((b) => b.id !== board.id);
  db.lists = db.lists.filter((l) => l.boardId !== board.id);
  db.cards = db.cards.filter((c) => !listIds.has(c.listId));

  await writeDb(db);
  res.status(204).end();
});

router.post('/:boardId/lists', async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const db = await readDb();
  const board = db.boards.find((b) => b.id === req.params.boardId);
  if (!board) return res.status(404).json({ error: 'board not found' });

  const siblingLists = db.lists.filter((l) => l.boardId === board.id);
  const now = new Date().toISOString();
  const list = {
    id: crypto.randomUUID(),
    boardId: board.id,
    title: title.trim(),
    order: siblingLists.length,
    createdAt: now,
    updatedAt: now,
  };
  db.lists.push(list);
  await writeDb(db);
  res.status(201).json(list);
});

router.put('/:boardId/lists/reorder', async (req, res) => {
  const { orderedListIds } = req.body;
  if (!Array.isArray(orderedListIds)) {
    return res.status(400).json({ error: 'orderedListIds must be an array' });
  }
  const db = await readDb();
  const listsById = new Map(
    db.lists.filter((l) => l.boardId === req.params.boardId).map((l) => [l.id, l])
  );
  orderedListIds.forEach((id, index) => {
    const list = listsById.get(id);
    if (list) list.order = index;
  });
  await writeDb(db);
  const lists = db.lists
    .filter((l) => l.boardId === req.params.boardId)
    .sort((a, b) => a.order - b.order);
  res.json(lists);
});

module.exports = router;
