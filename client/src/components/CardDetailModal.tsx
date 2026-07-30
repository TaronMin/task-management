import { useState } from 'react';
import { CARD_TITLE_MAX_LENGTH } from '../types';
import type { Card, CardPatch, ChecklistItem, Label, Priority } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  card: Card;
  onClose: () => void;
  onUpdate: (patch: Partial<Card>) => void;
  onDelete: () => void;
}

const LABEL_COLORS = ['#e0574c', '#e5a52c', '#e8d63f', '#4fae5a', '#3f8ee0', '#8a5fd6'];

const draftFromCard = (card: Card): Required<CardPatch> => ({
  title: card.title,
  description: card.description,
  priority: card.priority,
  dueDate: card.dueDate,
  labels: card.labels,
  checklist: card.checklist,
});

const CardDetailModal = ({ card, onClose, onUpdate, onDelete }: Props) => {
  const [draft, setDraft] = useState(() => draftFromCard(card));
  const [isDirty, setIsDirty] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateDraft = (patch: Partial<CardPatch>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
  };

  const titleError = !draft.title.trim()
    ? 'Title is required'
    : draft.title.trim().length > CARD_TITLE_MAX_LENGTH
      ? `Title must be ${CARD_TITLE_MAX_LENGTH} characters or fewer`
      : null;

  const handleSave = () => {
    if (titleError) return;
    onUpdate({ ...draft, title: draft.title.trim() });
    setIsDirty(false);
    onClose();
  };

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  };

  const addLabel = () => {
    if (!newLabelName.trim()) return;
    const color = LABEL_COLORS[draft.labels.length % LABEL_COLORS.length];
    const label: Label = { id: crypto.randomUUID(), name: newLabelName.trim(), color };
    updateDraft({ labels: [...draft.labels, label] });
    setNewLabelName('');
  };

  const removeLabel = (labelId: string) => {
    updateDraft({ labels: draft.labels.filter((l) => l.id !== labelId) });
  };

  const addChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const item: ChecklistItem = { id: crypto.randomUUID(), text: newChecklistText.trim(), done: false };
    updateDraft({ checklist: [...draft.checklist, item] });
    setNewChecklistText('');
  };

  const toggleChecklistItem = (itemId: string) => {
    updateDraft({
      checklist: draft.checklist.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)),
    });
  };

  const removeChecklistItem = (itemId: string) => {
    updateDraft({ checklist: draft.checklist.filter((i) => i.id !== itemId) });
  };

  const doneCount = draft.checklist.filter((i) => i.done).length;

  return (
    <div className="modal-backdrop" onClick={handleRequestClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleRequestClose}>
          ✕
        </button>

        <input
          className={titleError ? 'modal-title-input invalid' : 'modal-title-input'}
          value={draft.title}
          maxLength={CARD_TITLE_MAX_LENGTH}
          onChange={(e) => updateDraft({ title: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        <div className="title-meta">
          {titleError ? (
            <span className="field-error">{titleError}</span>
          ) : (
            <span className="char-counter">
              {draft.title.length}/{CARD_TITLE_MAX_LENGTH}
            </span>
          )}
        </div>

        <div className="modal-row">
          <label>Priority</label>
          <select
            value={draft.priority}
            onChange={(e) => updateDraft({ priority: e.target.value as Priority })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="modal-row">
          <label>Due date</label>
          <input
            type="date"
            value={draft.dueDate ?? ''}
            onChange={(e) => updateDraft({ dueDate: e.target.value || null })}
          />
        </div>

        <div className="modal-divider" />

        <div className="modal-section">
          <label>Description</label>
          <textarea
            rows={4}
            value={draft.description}
            onChange={(e) => updateDraft({ description: e.target.value })}
            placeholder="Add a more detailed description..."
          />
        </div>

        <div className="modal-section">
          <label>Labels</label>
          <div className="label-list">
            {draft.labels.map((label) => (
              <span key={label.id} className="card-label-chip" style={{ backgroundColor: label.color }}>
                {label.name}
                <span className="label-remove" onClick={() => removeLabel(label.id)}>
                  ✕
                </span>
              </span>
            ))}
          </div>
          <form
            className="label-add-form"
            onSubmit={(e) => {
              e.preventDefault();
              addLabel();
            }}
          >
            <input
              type="text"
              placeholder="New label name..."
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
            />
            <button type="submit">Add label</button>
          </form>
        </div>

        <div className="modal-section">
          <label>
            Checklist {draft.checklist.length > 0 && `(${doneCount}/${draft.checklist.length})`}
          </label>
          {draft.checklist.length > 0 && (
            <div className="checklist-progress-bar">
              <div
                className="checklist-progress-fill"
                style={{ width: `${(doneCount / draft.checklist.length) * 100}%` }}
              />
            </div>
          )}
          <ul className="checklist-items">
            {draft.checklist.map((item) => (
              <li key={item.id} className="checklist-item">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleChecklistItem(item.id)}
                />
                <span className={item.done ? 'checklist-text done' : 'checklist-text'}>{item.text}</span>
                <span className="checklist-remove" onClick={() => removeChecklistItem(item.id)}>
                  ✕
                </span>
              </li>
            ))}
          </ul>
          <form
            className="checklist-add-form"
            onSubmit={(e) => {
              e.preventDefault();
              addChecklistItem();
            }}
          >
            <input
              type="text"
              placeholder="Add a checklist item..."
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>
        </div>

        <div className="modal-divider" />

        <div className="modal-footer">
          <button className="save-card-btn" disabled={!isDirty || !!titleError} onClick={handleSave}>
            Save changes
          </button>
          <button className="delete-card-btn" onClick={() => setShowDeleteConfirm(true)}>
            Delete card
          </button>
        </div>
      </div>

      {showDiscardConfirm && (
        <ConfirmDialog
          title="Discard changes?"
          message="You have unsaved changes to this card. Discard them?"
          confirmLabel="Discard"
          danger
          onConfirm={onClose}
          onCancel={() => setShowDiscardConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete card?"
          message={`Delete "${card.title}"? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={onDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

export default CardDetailModal;
