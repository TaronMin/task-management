const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'db.json');
const EMPTY_DB = { boards: [], lists: [], cards: [] };

const readDb = async () => {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeDb(EMPTY_DB);
      return { ...EMPTY_DB };
    }
    throw err;
  }
};

const writeDb = async (db) => {
  const tmpFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
  await fs.rename(tmpFile, DATA_FILE);
};

module.exports = { readDb, writeDb };
