'use client';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-surface border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-black/30"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-foreground text-sm mb-5 whitespace-pre-line leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-border text-muted hover:text-foreground hover:bg-hover-bg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-red-500/90 text-white hover:bg-red-500 transition-all shadow-sm shadow-red-500/20"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
