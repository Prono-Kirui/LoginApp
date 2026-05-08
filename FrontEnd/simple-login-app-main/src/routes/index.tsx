import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome — Aurora" },
      { name: "description", content: "A simple, beautiful auth experience." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/home" });
  }, [user, loading, navigate]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%), radial-gradient(ellipse at bottom, color-mix(in oklab, var(--primary-glow) 18%, transparent), transparent 55%)",
        }}
      />
      <div className="mx-auto w-full max-w-sm text-center">
        <div
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">HI,</h1>
        <p className="mt-3 text-muted-foreground">
          A delightfully simple way to sign in.
        </p>
        <div className="mt-10 flex flex-col gap-3">
          <Button asChild size="lg" className="h-12 rounded-xl text-base">
            <Link to="/register">Create account</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-xl text-base">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
