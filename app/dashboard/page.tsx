export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Closet Upload Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Closet Upload</h2>
          <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <p className="text-gray-500">Upload Interface Placeholder</p>
          </div>
        </div>

        {/* Context Input Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Context Input</h2>
          <div className="space-y-4">
            <div className="h-10 bg-gray-100 rounded w-full"></div>
            <div className="h-10 bg-gray-100 rounded w-full"></div>
            <p className="text-sm text-gray-500 text-center mt-4">Weather & Occasion Inputs</p>
          </div>
        </div>

        {/* Outfit Result Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Outfit Result</h2>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">AI Recommendation Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
