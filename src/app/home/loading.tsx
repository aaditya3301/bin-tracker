export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#edf7f2] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );
}