import { useToastStore } from '@/stores/toast';

export default function Toast() {
  const message = useToastStore((s) => s.message);

  if (!message) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] animate-toast-up">
      <div className="bg-gray-800 text-white text-[13px] px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap">
        {message}
      </div>
    </div>
  );
}
