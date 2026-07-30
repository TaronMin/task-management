import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '../types';

interface Props {
  card: Card;
  onClick: () => void;
}

const isOverdue = (dueDate: string | null) => {
  if (!dueDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dueDate < today;
};

const CardItem = ({ card, onClick }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', listId: card.listId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const doneCount = card.checklist.filter((i) => i.done).length;
  const overdue = isOverdue(card.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card-item priority-accent-${card.priority}`}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      {card.labels.length > 0 && (
        <div className="card-labels">
          {card.labels.map((label) => (
            <span key={label.id} className="card-label-chip" style={{ backgroundColor: label.color }}>
              {label.name}
            </span>
          ))}
        </div>
      )}
      <div className="card-title">{card.title}</div>
      <div className="card-meta">
        <span className={`priority-badge priority-${card.priority}`}>{card.priority}</span>
        {card.dueDate && (
          <span className={overdue ? 'due-date-badge overdue' : 'due-date-badge'}>{card.dueDate}</span>
        )}
        {card.checklist.length > 0 && (
          <span className="checklist-badge">
            ☑ {doneCount}/{card.checklist.length}
          </span>
        )}
      </div>
    </div>
  );
};

export default CardItem;
