export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-neutral-400 font-medium text-sm animate-pulse">Loading Newsletter Manager...</p>
      </div>
    </div>
  );
}
