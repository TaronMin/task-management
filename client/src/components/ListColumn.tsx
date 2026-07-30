import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CardItem from './CardItem';
import InlineAddForm from './InlineAddForm';
import { CARD_TITLE_MAX_LENGTH } from '../types';
import type { Card, List } from '../types';

interface Props {
  list: List;
  cards: Card[];
  onAddCard: (listId: string, title: string) => void;
  onRename: (listId: string, title: string) => void;
  onDelete: (listId: string) => void;
  onCardClick: (cardId: string) => void;
}

const ListColumn = ({ list, cards, onAddCard, onRename, onDelete, onCardClick }: Props) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: 'list' },
  });
  const { setNodeRef: setDropRef } = useDroppable({ id: `container-${list.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const commitRename = () => {
    setEditing(false);
    if (title.trim() && title.trim() !== list.title) {
      onRename(list.id, title.trim());
    } else {
      setTitle(list.title);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="list-column">
      <div className="list-header" {...attributes} {...listeners}>
        {editing ? (
          <input
            autoFocus
            className="list-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => e.key === 'Enter' && commitRename()}
          />
        ) : (
          <span className="list-title" onClick={() => setEditing(true)}>
            {list.title}
            <span className="list-card-count">{cards.length}</span>
          </span>
        )}
        <button className="list-delete-btn" onClick={() => onDelete(list.id)} title="Delete list">
          ✕
        </button>
      </div>

      <div ref={setDropRef} className="list-cards">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem key={card.id} card={card} onClick={() => onCardClick(card.id)} />
          ))}
        </SortableContext>
        {cards.length === 0 && <p className="list-empty-placeholder">No cards yet</p>}
      </div>

      <InlineAddForm
        buttonLabel="+ Add a card"
        placeholder="Card title..."
        onSubmit={(value) => onAddCard(list.id, value)}
        className="add-card-form"
        maxLength={CARD_TITLE_MAX_LENGTH}
      />
    </div>
  );
};

export default ListColumn;
