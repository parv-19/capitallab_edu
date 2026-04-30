export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-brand-gold rounded-full animate-spin"></div>
        <p className="text-brand-navy font-medium text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
