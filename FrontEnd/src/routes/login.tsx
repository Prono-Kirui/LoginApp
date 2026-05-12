// src/routes/login.tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Aurora" }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(1, "Password required").max(72),
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

 const onSubmit = async (e: FormEvent) => {
  e.preventDefault();

  const parsed = schema.safeParse(form);
  if (!parsed.success) {
    toast.error(parsed.error.issues[0].message);
    return;
  }

  setLoading(true);

  try {
    await login(parsed.data.email, parsed.data.password);
    toast.success("Welcome back! 👋");
    navigate({ to: "/home" });
  } catch (error: any) {
    const msg = error?.message?.toLowerCase() || "";

    if (msg.includes("invalid credentials") || msg.includes("unauthorized")) {
      toast.error("Invalid credentials");
    } else if (msg.includes("network") || msg.includes("failed to fetch")) {
      toast.error("Cannot connect to server. Is the backend running?");
    } else {
      toast.error(error.message || "Login failed");
    }
  } finally {
    setLoading(false);
  }
};
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue."
      footer={
        <>
          <div>
            New here?{" "}
            <Link to="/register" className="font-medium text-foreground hover:underline">
              Create account
            </Link>
          </div>
          <div className="mt-2">
            <Link to="/forgot-password" className="font-medium text-foreground hover:underline">
              Forgot password?
            </Link>
          </div>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="h-12 rounded-xl"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="h-12 rounded-xl"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}