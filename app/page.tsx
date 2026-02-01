import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">Reservation System</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Multi-tenant booking platform for service providers
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/signin"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            Provider Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
