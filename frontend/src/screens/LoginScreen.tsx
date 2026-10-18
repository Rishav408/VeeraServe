import { motion } from "framer-motion";
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "../components/ui";
import { useAppData } from "../context/AppDataContext";
import type { UserRole } from "../types/domain";

export default function LoginScreen() {
  const [name, setName] = useState("Guest");
  const [role, setRole] = useState<UserRole>("guest");
  const [activeTab, setActiveTab] = useState("guest");
  const { login } = useAppData();
  const navigate = useNavigate();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login(name || "Guest", role);
    navigate("/profile");
  };

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
          <button
            type="button"
            onClick={() => setActiveTab("guest")}
            className={`flex-1 rounded-pill py-2 text-sm font-semibold transition ${
              activeTab === "guest"
                ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-btn-primary"
                : "bg-cream text-ink-muted hover:bg-primary/10"
            }`}
          >
            Guest
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`flex-1 rounded-pill py-2 text-sm font-semibold transition ${
              activeTab === "login"
                ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-btn-primary"
                : "bg-cream text-ink-muted hover:bg-primary/10"
            }`}
          >
            Login / Admin
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {activeTab === "guest" ? (
            <>
              <label className="block">
                <span className="text-sm font-semibold text-ink-soft">Your Name</span>
                <Input
                  className="mt-1.5"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                />
              </label>
              <Button type="submit" className="flex h-[52px] w-full items-center justify-center text-base font-semibold">
                Continue →
              </Button>
            </>
          ) : (
            <>
              <label className="block">
                <span className="text-sm font-semibold text-ink-soft">Email</span>
                <Input
                  type="email"
                  className="mt-1.5"
                  placeholder="admin@veeradhabha.com"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-ink-soft">Password</span>
                <Input
                  type="password"
                  className="mt-1.5"
                  placeholder="••••••••"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-ink-soft">Role</span>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  className="mt-1.5 w-full rounded-[12px] border border-primary/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-primary"
                >
                  <option value="guest">Guest</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <Button type="submit" className="flex h-[52px] w-full items-center justify-center text-base font-semibold">
                Sign In
              </Button>
            </>
          )}
        </form>
      </motion.div>
    </div>
  );
}
