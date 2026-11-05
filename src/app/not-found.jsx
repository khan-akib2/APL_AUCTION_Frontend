import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8f6f0] flex items-center justify-center text-center p-4">
      <div className="bg-white border border-[#e8e2d5] rounded-3xl p-8 sm:p-12 shadow-sm max-w-md w-full">
        <div className="text-7xl font-black text-[#c59b27] mb-3">404</div>
        <h1 className="text-2xl font-bold font-serif text-[#111827] mb-2">Page Not Found</h1>
        <p className="text-[#6b7280] text-sm mb-6">The page or section you are looking for does not exist or has been relocated.</p>
        <Link href="/" className="inline-block bg-[#0d3a24] hover:bg-[#154d32] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
