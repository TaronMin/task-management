const express = require('express');
const { readDb, writeDb } = require('../store');

const router = express.Router();
const PRIORITIES = ['low', 'medium', 'high'];
const TITLE_MAX_LENGTH = 70;
const PATCHABLE_FIELDS = ['title', 'description', 'priority', 'dueDate', 'labels', 'checklist'];

router.put('/move', async (req, res) => {
  const { cardId, destListId, destOrderedCardIds } = req.body;
  if (!cardId || !destListId || !Array.isArray(destOrderedCardIds)) {
    return res.status(400).json({ error: 'cardId, destListId and destOrderedCardIds are required' });
  }

  const db = await readDb();
  const card = db.cards.find((c) => c.id === cardId);
  if (!card) return res.status(404).json({ error: 'card not found' });

  const sourceListId = card.listId;
  card.listId = destListId;
  card.updatedAt = new Date().toISOString();

  const cardsById = new Map(db.cards.map((c) => [c.id, c]));
  destOrderedCardIds.forEach((id, index) => {
    const c = cardsById.get(id);
    if (c) {
      c.listId = destListId;
      c.order = index;
    }
  });

  if (sourceListId !== destListId) {
    db.cards
      .filter((c) => c.listId === sourceListId)
      .sort((a, b) => a.order - b.order)
      .forEach((c, index) => {
        c.order = index;
      });
  }

  await writeDb(db);
  res.json(card);
});

router.put('/:id', async (req, res) => {
  const db = await readDb();
  const card = db.cards.find((c) => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'card not found' });

  const patch = req.body || {};

  if (typeof patch.title === 'string') {
    const trimmedTitle = patch.title.trim();
    if (!trimmedTitle) {
      return res.status(400).json({ error: 'title cannot be empty' });
    }
    if (trimmedTitle.length > TITLE_MAX_LENGTH) {
      return res.status(400).json({ error: `title must be ${TITLE_MAX_LENGTH} characters or fewer` });
    }
  } else if (patch.title !== undefined) {
    return res.status(400).json({ error: 'title must be a string' });
  }
  if (patch.priority !== undefined && !PRIORITIES.includes(patch.priority)) {
    return res.status(400).json({ error: `priority must be one of ${PRIORITIES.join(', ')}` });
  }

  for (const field of PATCHABLE_FIELDS) {
    if (patch[field] !== undefined) {
      card[field] = field === 'title' ? patch[field].trim() : patch[field];
    }
  }
  card.updatedAt = new Date().toISOString();
  await writeDb(db);
  res.json(card);
});

router.delete('/:id', async (req, res) => {
  const db = await readDb();
  const card = db.cards.find((c) => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'card not found' });

  db.cards = db.cards.filter((c) => c.id !== card.id);
  db.cards
    .filter((c) => c.listId === card.listId)
    .sort((a, b) => a.order - b.order)
    .forEach((c, index) => {
      c.order = index;
    });

  await writeDb(db);
  res.status(204).end();
});

module.exports = router;
