import { useEffect } from 'react';

// Mientras `open` es true, llama a `onClose` al pulsar fuera de `ref` o con Esc.
export default function useDismiss(ref, open, onClose) {
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (!ref.current.contains(e.target)) onClose();
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, open, onClose]);
}
