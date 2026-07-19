export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-64 rounded bg-gray-200" />
      <div className="mt-6 space-y-3">
        <div className="h-24 rounded-lg bg-gray-200" />
        <div className="h-24 rounded-lg bg-gray-200" />
        <div className="h-24 rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}
