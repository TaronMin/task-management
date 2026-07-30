import { useState } from 'react';

interface Props {
  buttonLabel: string;
  placeholder: string;
  onSubmit: (value: string) => void;
  className?: string;
  maxLength?: number;
}

const InlineAddForm = ({ buttonLabel, placeholder, onSubmit, className, maxLength }: Props) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setValue('');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Title is required');
      return;
    }
    if (maxLength && trimmed.length > maxLength) {
      setError(`Title must be ${maxLength} characters or fewer`);
      return;
    }
    onSubmit(trimmed);
    close();
  };

  if (!open) {
    return (
      <button type="button" className={`inline-add-trigger ${className ?? ''}`} onClick={() => setOpen(true)}>
        {buttonLabel}
      </button>
    );
  }

  return (
    <form className={`inline-add-form ${className ?? ''}`} onSubmit={handleSubmit}>
      <input
        autoFocus
        type="text"
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close();
        }}
      />
      {error && <p className="field-error">{error}</p>}
      <div className="inline-add-actions">
        <button type="submit">Add</button>
        <button type="button" onClick={close}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default InlineAddForm;
