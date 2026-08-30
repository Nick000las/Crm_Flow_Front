import { useEffect, useRef } from 'react';

export function EditorDialog({
  children,
  busy,
  onClose,
  titleId = 'kb-editor-title',
  className = '',
}) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    element.querySelector('input:not([type="checkbox"]), textarea')?.focus();
    return () => element.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className={`kb-editor ${className}`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) {
          onClose();
        }
      }}
    >
      {children}
    </dialog>
  );
}
