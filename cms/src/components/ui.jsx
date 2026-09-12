import { useEffect } from 'react';
import { IconClose, IconPlus, IconTrash, IconUp, IconDown } from './Icons';

/* ------------------------------------------------------------- Card */
export function Card({ title, subtitle, actions, children, flush = false }) {
  return (
    <div className="rf-card">
      {(title || actions) && (
        <div className="rf-card-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <div className="rf-card-sub">{subtitle}</div>}
          </div>
          {actions && <div className="rf-card-head-actions">{actions}</div>}
        </div>
      )}
      <div className={`rf-card-body${flush ? ' is-flush' : ''}`}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------- Button */
export function Button({
  variant = 'ghost',
  size,
  loading = false,
  block = false,
  children,
  className = '',
  ...rest
}) {
  const classes = [
    'rf-btn',
    `rf-btn-${variant}`,
    size === 'sm' ? 'rf-btn-sm' : '',
    size === 'icon' ? 'rf-btn-sm rf-btn-icon' : '',
    block ? 'rf-btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className={`rf-spinner${variant !== 'primary' ? ' is-dark' : ''}`} /> : children}
    </button>
  );
}

/* ------------------------------------------------------------- Field */
export function Field({ label, required, hint, children }) {
  return (
    <div className="rf-field">
      {label && (
        <label className="rf-label">
          {label}
          {required && <span className="rf-req">*</span>}
        </label>
      )}
      {children}
      {hint && <div className="rf-hint">{hint}</div>}
    </div>
  );
}

export function Input({ className = '', ...rest }) {
  return <input className={`rf-input ${className}`.trim()} {...rest} />;
}

export function Textarea({ code = false, className = '', ...rest }) {
  return <textarea className={`rf-textarea${code ? ' is-code' : ''} ${className}`.trim()} {...rest} />;
}

export function Select({ className = '', children, ...rest }) {
  return (
    <select className={`rf-select ${className}`.trim()} {...rest}>
      {children}
    </select>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <label className="rf-switch">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="rf-switch-track" />
      {label && <span className="rf-switch-text">{label}</span>}
    </label>
  );
}

/* ------------------------------------------------------------- Badge */
export function Badge({ tone = 'off', children }) {
  return <span className={`rf-badge rf-badge-${tone}`}>{children}</span>;
}

export function PublishBadge({ value }) {
  return <Badge tone={value ? 'on' : 'off'}>{value ? 'Tayang' : 'Draft'}</Badge>;
}

/* ------------------------------------------------------------- Modal */
export function Modal({ open, title, onClose, children, footer, width }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = width === 'wide' ? ' is-wide' : width === 'narrow' ? ' is-narrow' : '';

  return (
    <div className="rf-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`rf-modal${sizeClass}`} role="dialog" aria-modal="true">
        <div className="rf-modal-head">
          <h3>{title}</h3>
          <button type="button" className="rf-modal-close" onClick={onClose} aria-label="Tutup">
            <IconClose size={20} />
          </button>
        </div>
        <div className="rf-modal-body">{children}</div>
        {footer && <div className="rf-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Hapus', onConfirm, onClose, busy }) {
  return (
    <Modal
      open={open}
      title={title || 'Konfirmasi'}
      onClose={onClose}
      width="narrow"
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, color: 'var(--rf-mid)' }}>{message}</p>
    </Modal>
  );
}

/* ------------------------------------------------------------- States */
export function Loading({ text = 'Memuat data…' }) {
  return (
    <div className="rf-loading">
      <span className="rf-spinner is-dark" />
      {text}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="rf-empty">
      <div className="rf-empty-title">{title}</div>
      {text && <div className="rf-empty-text">{text}</div>}
      {action}
    </div>
  );
}

export function Alert({ tone = 'info', children }) {
  if (!children) return null;
  return <div className={`rf-alert rf-alert-${tone}`}>{children}</div>;
}

/* ------------------------------------------------------------- Repeater */
export function Repeater({ items, onChange, fields, addLabel = 'Tambah Item', emptyText }) {
  const list = Array.isArray(items) ? items : [];

  const update = (index, key, value) => {
    const next = list.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    onChange(next);
  };

  const move = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () => {
    const blank = fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});
    onChange([...list, blank]);
  };

  return (
    <div>
      {list.length === 0 && (
        <div className="rf-hint" style={{ marginBottom: 12 }}>
          {emptyText || 'Belum ada item.'}
        </div>
      )}

      {list.map((item, index) => (
        <div className="rf-repeater-item" key={index}>
          <div className="rf-repeater-head">
            <span className="rf-repeater-num">{String(index + 1).padStart(2, '0')}</span>
            <div className="rf-repeater-tools">
              <Button size="icon" onClick={() => move(index, -1)} disabled={index === 0} title="Naik">
                <IconUp size={15} />
              </Button>
              <Button
                size="icon"
                onClick={() => move(index, 1)}
                disabled={index === list.length - 1}
                title="Turun"
              >
                <IconDown size={15} />
              </Button>
              <Button
                size="icon"
                variant="danger"
                onClick={() => onChange(list.filter((_, i) => i !== index))}
                title="Hapus"
              >
                <IconTrash size={15} />
              </Button>
            </div>
          </div>

          {fields.map((f) =>
            f.type === 'textarea' ? (
              <Field key={f.key} label={f.label}>
                <Textarea
                  rows={f.rows || 3}
                  value={item[f.key] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => update(index, f.key, e.target.value)}
                />
              </Field>
            ) : (
              <Field key={f.key} label={f.label}>
                <Input
                  value={item[f.key] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => update(index, f.key, e.target.value)}
                />
              </Field>
            )
          )}
        </div>
      ))}

      <Button onClick={add}>
        <IconPlus size={15} /> {addLabel}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------- Tag input */
export function TagInput({ value, onChange, placeholder = 'Ketik lalu tekan Enter' }) {
  const tags = Array.isArray(value) ? value : [];

  const addTag = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const raw = e.target.value.trim();
    if (!raw || tags.includes(raw)) return;
    onChange([...tags, raw]);
    e.target.value = '';
  };

  return (
    <div>
      <Input placeholder={placeholder} onKeyDown={addTag} />
      {tags.length > 0 && (
        <div className="rf-chip-row">
          {tags.map((tag) => (
            <span className="rf-chip" key={tag}>
              {tag}
              <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))}>
                <IconClose size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
