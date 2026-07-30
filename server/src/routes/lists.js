const express = require('express');
const crypto = require('crypto');
const { readDb, writeDb } = require('../store');

const router = express.Router();
const CARD_TITLE_MAX_LENGTH = 70;

router.put('/:id', async (req, res) => {
  const { title } = req.body;
  const db = await readDb();
  const list = db.lists.find((l) => l.id === req.params.id);
  if (!list) return res.status(404).json({ error: 'list not found' });

  if (typeof title === 'string') {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return res.status(400).json({ error: 'title cannot be empty' });
    list.title = trimmedTitle;
  } else if (title !== undefined) {
    return res.status(400).json({ error: 'title must be a string' });
  }
  list.updatedAt = new Date().toISOString();
  await writeDb(db);
  res.json(list);
});

router.delete('/:id', async (req, res) => {
  const db = await readDb();
  const list = db.lists.find((l) => l.id === req.params.id);
  if (!list) return res.status(404).json({ error: 'list not found' });

  db.lists = db.lists.filter((l) => l.id !== list.id);
  db.cards = db.cards.filter((c) => c.listId !== list.id);

  db.lists
    .filter((l) => l.boardId === list.boardId)
    .sort((a, b) => a.order - b.order)
    .forEach((l, index) => {
      l.order = index;
    });

  await writeDb(db);
  res.status(204).end();
});

router.post('/:listId/cards', async (req, res) => {
  const { title } = req.body;
  const trimmedTitle = (title || '').trim();
  if (!trimmedTitle) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (trimmedTitle.length > CARD_TITLE_MAX_LENGTH) {
    return res.status(400).json({ error: `title must be ${CARD_TITLE_MAX_LENGTH} characters or fewer` });
  }
  const db = await readDb();
  const list = db.lists.find((l) => l.id === req.params.listId);
  if (!list) return res.status(404).json({ error: 'list not found' });

  const siblingCards = db.cards.filter((c) => c.listId === list.id);
  const now = new Date().toISOString();
  const card = {
    id: crypto.randomUUID(),
    listId: list.id,
    title: trimmedTitle,
    description: '',
    priority: 'medium',
    dueDate: null,
    labels: [],
    checklist: [],
    order: siblingCards.length,
    createdAt: now,
    updatedAt: now,
  };
  db.cards.push(card);
  await writeDb(db);
  res.status(201).json(card);
});

module.exports = router;
