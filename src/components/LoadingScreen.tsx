export function LoadingScreen({ label = 'Chargement...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-stone-400">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-navy-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
