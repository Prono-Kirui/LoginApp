// src/routes/reset-password.tsx
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — Aurora" }] }),
  component: ResetPasswordPage,
});

// Get token and email from URL query parameters
const searchSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1, "Token is required"),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { email, token } = useSearch({ from: "/reset-password", select: (s) => searchSchema.parse(s) });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5043/api/Auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          token: token,
          newPassword: form.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to reset password");
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (success) {
    return (
      <AuthShell
        title="Password Reset Successful"
        subtitle="Your password has been reset successfully."
        footer={null}
      >
        <div className="text-center space-y-6 py-8">
          <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl">
            ✅
          </div>
          <Button
            onClick={() => navigate({ to: "/login" })}
            className="h-12 w-full rounded-xl text-base"
          >
            Go to Login
          </Button>
        </div>
      </AuthShell>
    );
  }

  // Form Screen
  return (
    <AuthShell
      title="Reset Your Password"
      subtitle="Enter your new password below"
      footer={null}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="h-12 rounded-xl"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="h-12 rounded-xl"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-xl">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl text-base"
        >
          {loading ? "Resetting Password..." : "Reset Password"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate({ to: "/login" })}
            className="hover:underline"
          >
            Back to Login
          </button>
        </div>
      </form>
    </AuthShell>
  );
}