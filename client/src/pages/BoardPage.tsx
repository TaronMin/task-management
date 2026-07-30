import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import * as api from '../api';
import type { Board, Card, List } from '../types';
import ListColumn from '../components/ListColumn';
import CardItem from '../components/CardItem';
import CardDetailModal from '../components/CardDetailModal';
import InlineAddForm from '../components/InlineAddForm';
import ConfirmDialog from '../components/ConfirmDialog';

const BoardPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [listPendingDelete, setListPendingDelete] = useState<List | null>(null);
  const [activeList, setActiveList] = useState<List | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!boardId) return;
    api
      .getBoardDetail(boardId)
      .then((detail) => {
        setBoard(detail.board);
        setLists(detail.lists);
        setCards(detail.cards);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [boardId]);

  const sortedLists = [...lists].sort((a, b) => a.order - b.order);
  const cardsForList = (listId: string) =>
    cards.filter((c) => c.listId === listId).sort((a, b) => a.order - b.order);

  const resolveDestListId = (overId: string): string | undefined => {
    if (overId.startsWith('container-')) return overId.slice('container-'.length);
    if (lists.some((l) => l.id === overId)) return overId;
    return cards.find((c) => c.id === overId)?.listId;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'list') {
      setActiveList(lists.find((l) => l.id === active.id) ?? null);
    } else {
      setActiveCard(cards.find((c) => c.id === active.id) ?? null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.data.current?.type !== 'card') return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const destListId = resolveDestListId(overId);
    if (!destListId) return;

    setCards((prev) => {
      const activeCardEntry = prev.find((c) => c.id === activeId);
      if (!activeCardEntry || activeCardEntry.listId === destListId) return prev;
      return prev.map((c) => (c.id === activeId ? { ...c, listId: destListId } : c));
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveList(null);
    setActiveCard(null);
    if (!over || !boardId) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (active.data.current?.type === 'list') {
      if (activeId === overId) return;
      const oldIndex = sortedLists.findIndex((l) => l.id === activeId);
      const newIndex = sortedLists.findIndex((l) => l.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(sortedLists, oldIndex, newIndex).map((l, i) => ({ ...l, order: i }));
      setLists(reordered);
      api.reorderLists(boardId, reordered.map((l) => l.id)).catch((err) => setError(err.message));
      return;
    }

    setCards((prev) => {
      const activeCardEntry = prev.find((c) => c.id === activeId);
      if (!activeCardEntry) return prev;
      const destListId = activeCardEntry.listId;
      const destCards = prev.filter((c) => c.listId === destListId).sort((a, b) => a.order - b.order);
      const oldIndex = destCards.findIndex((c) => c.id === activeId);
      let newIndex = destCards.findIndex((c) => c.id === overId);
      if (newIndex === -1) newIndex = destCards.length - 1;
      const reorderedDest = arrayMove(destCards, oldIndex, newIndex).map((c, i) => ({ ...c, order: i }));
      const reorderedIds = reorderedDest.map((c) => c.id);
      api.moveCard(activeId, destListId, reorderedIds).catch((err) => setError(err.message));

      const others = prev.filter((c) => c.listId !== destListId);
      return [...others, ...reorderedDest];
    });
  };

  const handleAddList = async (title: string) => {
    if (!boardId) return;
    const list = await api.createList(boardId, title);
    setLists((prev) => [...prev, list]);
  };

  const handleRenameList = async (listId: string, title: string) => {
    const updated = await api.renameList(listId, title);
    setLists((prev) => prev.map((l) => (l.id === listId ? updated : l)));
  };

  const handleDeleteList = (listId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (list) setListPendingDelete(list);
  };

  const confirmDeleteList = async () => {
    if (!listPendingDelete) return;
    const listId = listPendingDelete.id;
    setListPendingDelete(null);
    await api.deleteList(listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));
    setCards((prev) => prev.filter((c) => c.listId !== listId));
  };

  const handleAddCard = async (listId: string, title: string) => {
    const card = await api.createCard(listId, title);
    setCards((prev) => [...prev, card]);
  };

  const handleUpdateCard = async (cardId: string, patch: Partial<Card>) => {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...patch } : c)));
    await api.updateCard(cardId, patch);
  };

  const handleDeleteCard = async (cardId: string) => {
    await api.deleteCard(cardId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setSelectedCardId(null);
  };

  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? null;

  if (loading) return <p className="board-status">Loading board...</p>;
  if (error && !board) return <p className="board-status error-banner">{error}</p>;
  if (!board) return <p className="board-status">Board not found.</p>;

  return (
    <div className="board-page">
      <header className="board-page-header">
        <Link to="/" className="back-link">
          ← Boards
        </Link>
        <h1>{board.title}</h1>
      </header>

      {error && <p className="error-banner">{error}</p>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="board-lists-row">
          <SortableContext items={sortedLists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
            {sortedLists.map((list) => (
              <ListColumn
                key={list.id}
                list={list}
                cards={cardsForList(list.id)}
                onAddCard={handleAddCard}
                onRename={handleRenameList}
                onDelete={handleDeleteList}
                onCardClick={setSelectedCardId}
              />
            ))}
          </SortableContext>

          <InlineAddForm
            buttonLabel="+ Add another list"
            placeholder="List title..."
            onSubmit={handleAddList}
            className="add-list-form"
          />
        </div>

        <DragOverlay>
          {activeCard && <CardItem card={activeCard} onClick={() => {}} />}
          {activeList && (
            <div className="list-column list-column-overlay">
              <div className="list-header">
                <span className="list-title">{activeList.title}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCardId(null)}
          onUpdate={(patch) => handleUpdateCard(selectedCard.id, patch)}
          onDelete={() => handleDeleteCard(selectedCard.id)}
        />
      )}

      {listPendingDelete && (
        <ConfirmDialog
          title="Delete list?"
          message={`Delete "${listPendingDelete.title}" and all its cards? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDeleteList}
          onCancel={() => setListPendingDelete(null)}
        />
      )}
    </div>
  );
};

export default BoardPage;
