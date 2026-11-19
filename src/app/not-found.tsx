import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-heading text-4xl font-bold uppercase tracking-tight md:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-center text-muted-foreground">
        The page you are looking for does not exist or may have been removed. Explore our
        current collection instead.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button asChild className="bg-gold text-gold-foreground hover:bg-gold-dark">
          <Link href="/inventory">Browse Inventory</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
