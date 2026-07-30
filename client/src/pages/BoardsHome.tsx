import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBoard, deleteBoard, getBoards } from '../api';
import InlineAddForm from '../components/InlineAddForm';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Board } from '../types';

const TILE_COLORS = [
  '#0079bf',
  '#d29034',
  '#519839',
  '#b04632',
  '#89609e',
  '#cd5a91',
  '#4bbf6b',
  '#00aecc',
];

const BoardsHome = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boardPendingDelete, setBoardPendingDelete] = useState<Board | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getBoards()
      .then(setBoards)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (title: string) => {
    try {
      const board = await createBoard(title);
      setBoards((prev) => [...prev, board]);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const confirmDeleteBoard = async () => {
    if (!boardPendingDelete) return;
    const boardId = boardPendingDelete.id;
    setBoardPendingDelete(null);
    try {
      await deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="boards-home">
      <header className="boards-home-header">
        <h1>Your Boards</h1>
        {!loading && (
          <p className="boards-home-subtitle">
            {boards.length === 0
              ? 'Create your first board to get started'
              : `${boards.length} board${boards.length === 1 ? '' : 's'}`}
          </p>
        )}
      </header>

      {error && <p className="error-banner">{error}</p>}
      {loading ? (
        <p className="board-status">Loading...</p>
      ) : (
        <div className="board-grid">
          {boards.map((board, index) => (
            <button
              key={board.id}
              className="board-tile"
              style={{ backgroundColor: TILE_COLORS[index % TILE_COLORS.length] }}
              onClick={() => navigate(`/board/${board.id}`)}
              title={`Open "${board.title}"`}
            >
              <span className="board-tile-title">{board.title}</span>
              <span
                className="board-tile-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setBoardPendingDelete(board);
                }}
                title="Delete board"
              >
                ✕
              </span>
            </button>
          ))}

          <InlineAddForm
            buttonLabel="+ Create new board"
            placeholder="Board title..."
            onSubmit={handleCreate}
            className="board-tile-new"
          />
        </div>
      )}

      {boardPendingDelete && (
        <ConfirmDialog
          title="Delete board?"
          message={`Delete "${boardPendingDelete.title}" and everything in it? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDeleteBoard}
          onCancel={() => setBoardPendingDelete(null)}
        />
      )}
    </div>
  );
};

export default BoardsHome;
