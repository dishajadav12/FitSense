import Link from "next/link";
import { ShoppingBag, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-pink-50">
      <div className="flex items-center gap-3 mb-4">
        <ShoppingBag className="text-pink-600 w-12 h-12" />
        <h1 className="text-6xl font-bold text-pink-900 tracking-tight">fitsense</h1>
      </div>
      <p className="text-xl mb-12 text-pink-800 opacity-80 font-medium">Context-aware outfit decisions.</p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Link 
          href="/dashboard?view=add"
          className="flex-1 px-8 py-4 bg-white text-pink-600 border-2 border-pink-200 hover:bg-pink-50 rounded-2xl text-lg font-bold transition-all shadow-sm flex items-center justify-center gap-2"
        >
          Add to Closet
        </Link>
        <Link 
          href="/dashboard"
          className="flex-1 px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl text-lg font-bold transition-all shadow-md shadow-pink-200 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Choose Your Fit
        </Link>
      </div>
    </main>
  );
}
