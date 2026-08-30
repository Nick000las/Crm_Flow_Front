import { NativeDialog } from '@/components/ui/native-dialog';

export function EditorDialog({
  children,
  busy,
  onClose,
  titleId = 'kb-editor-title',
  className = '',
}) {
  return (
    <NativeDialog
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
    </NativeDialog>
  );
}
