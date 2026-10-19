import { motion } from "framer-motion";
import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Input } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/apiClient";

type Mode = "login" | "register";

interface LocationState {
  from?: string;
}

export default function LoginScreen() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as LocationState | null)?.from ?? "/";

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "register") {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const tabClass = (value: Mode) =>
    `flex-1 rounded-pill py-2 text-sm font-semibold transition ${
      mode === value
        ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-btn-primary"
        : "bg-cream text-ink-muted hover:bg-primary/10"
    }`;

  return (
    <div className="flex items-center justify-center py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d w-full max-w-sm rounded-[24px] p-8"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white shadow-glow-orange">
            VD
          </div>
          <h1 className="font-display text-2xl text-ink">Veera Dhabha</h1>
          <p className="text-xs text-ink-muted">AI-Powered Ordering</p>
        </div>

        <div className="mb-5 flex gap-2">
          <button type="button" onClick={() => setMode("login")} className={tabClass("login")}>
            Login
          </button>
          <button type="button" onClick={() => setMode("register")} className={tabClass("register")}>
            Register
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <label className="block">
              <span className="text-sm font-semibold text-ink-soft">Name</span>
              <Input
                className="mt-1.5"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                required
              />
            </label>
          )}
          <label className="block">
            <span className="text-sm font-semibold text-ink-soft">Email</span>
            <Input
              type="email"
              className="mt-1.5"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink-soft">Password</span>
            <Input
              type="password"
              className="mt-1.5"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              minLength={mode === "register" ? 8 : undefined}
              required
            />
          </label>

          {error && (
            <p className="rounded-[12px] bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="flex h-[52px] w-full items-center justify-center text-base font-semibold"
          >
            {submitting ? "Please wait…" : mode === "register" ? "Create account" : "Sign In"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/menu")}
          className="mt-4 w-full text-center text-sm font-semibold text-ink-muted transition hover:text-primary"
        >
          Continue as guest →
        </button>
      </motion.div>
    </div>
  );
}
