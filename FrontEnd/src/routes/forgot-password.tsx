// src/routes/forgot-password.tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — Aurora" }] }),
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [form, setForm] = useState({ email: "" });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    setError("");
    setSuccess("");

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5043/api/Auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        const errorMsg = data.message || "Failed to send reset link";
        setError(errorMsg);
        
        // Auto clear error after 4 seconds
        setTimeout(() => setError(""), 4000);
        return;
      }

      // Success
      setEmailSent(true);
      const successMsg = data.message || "Password reset link has been sent to your email.";
      setSuccess(successMsg);
      
      // Auto clear success message after 4 seconds (optional)
      setTimeout(() => setSuccess(""), 4000);

    } catch (err: any) {
      const errorMsg = "Network error. Please check your connection and try again.";
      setError(errorMsg);
      setTimeout(() => setError(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  // Success Screen (when email is "sent")
  if (emailSent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`We've sent a password reset link to ${form.email}`}
        footer={
          <Link
            to="/login"
            className="font-medium text-foreground hover:underline"
          >
            Back to Sign in
          </Link>
        }
      >
        <div className="text-center space-y-6 py-8">
          <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl">
            ✉️
          </div>
          <p className="text-muted-foreground">
            Please check your inbox and spam folder.
          </p>
        </div>
      </AuthShell>
    );
  }

  // Form Screen
  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link
          to="/login"
          className="font-medium text-foreground hover:underline"
        >
          Back to Sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ email: e.target.value })}
            className="h-12 rounded-xl"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-xl">
            {error}
          </p>
        )}

        {/* Success Message */}
        {success && (
          <p className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-xl">
            {success}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl text-base"
        >
          {loading ? "Sending reset link..." : "Send Reset Link"}
        </Button>

      </form>
    </AuthShell>
  );
}