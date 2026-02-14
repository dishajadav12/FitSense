import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <h1 className="text-6xl font-bold mb-4">fitsense</h1>
      <p className="text-xl mb-8 opacity-80">Context-aware outfit decisions.</p>
      <Link 
        href="/dashboard"
        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg font-semibold transition-colors"
      >
        Start
      </Link>
    </main>
  );
}
