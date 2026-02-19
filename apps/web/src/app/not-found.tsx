import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      {/* Large 404 */}
      <h1
        className="text-7xl font-bold text-[#C9A84C] mb-4 tracking-tight"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        404
      </h1>

      {/* Heading */}
      <h2
        className="text-2xl font-semibold text-[#F0F1F5] mb-2"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Page Not Found
      </h2>

      {/* Description */}
      <p className="text-sm text-[#6B7489] max-w-xs mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      {/* CTA */}
      <Link
        href="/"
        className="px-6 py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#A07E2E] text-white text-sm font-medium transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
