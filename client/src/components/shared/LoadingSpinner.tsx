export default function LoadingSpinner({ text = 'Testing...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-gray-400 text-sm">{text}</span>
    </div>
  );
}
