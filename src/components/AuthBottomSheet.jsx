import React, { useState } from "react";
import Icon from "./Icon";
import { Sheet, Button, Input, Card, Avatar } from "./ui";
import { supabase, isSupabaseConfigured } from "../services/supabase";

export default function AuthBottomSheet({
  user,
  syncStatus,
  streakCount = 0,
  activeDaysCount = 0,
  learnedCount = 0,
  theme = "system",
  onToggleTheme,
  onOpenLearnedWords,
  onOpenSettings,
  onClose,
  onForceSync,
  onSignOut,
}) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase || loading) return;

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Please enter both your email and password.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      if (mode === "signup") {
        if (password.length < 6) {
          setError("Password must be at least 6 characters long.");
          setLoading(false);
          return;
        }
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });
        if (signUpErr) throw signUpErr;
        if (data.user && !data.session) {
          setNotice("Account created. Check your inbox to confirm, then sign in.");
          setMode("signin");
        } else {
          onClose();
        }
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInErr) throw signInErr;
        onClose();
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      isOpen={true}
      onClose={onClose}
      title="Profile"
      actionButton={
        <Button variant="ghost" size="sm" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-6 pt-2">
        {/* User Summary Header */}
        <div className="flex items-center gap-3.5">
          <Avatar
            name={user?.email || "Guest User"}
            icon={user ? null : <Icon name="user" className="w-5 h-5" />}
            size="lg"
          />
          <div className="min-w-0">
            <h3 className="text-headline font-semibold text-primary truncate">
              {user ? user.email.split("@")[0] : "Guest Learner"}
            </h3>
            <p className="text-caption text-muted truncate">
              {user ? user.email : "Local practice mode"}
            </p>
          </div>
        </div>

        {/* Learning Stats 3-Column Strip */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <span className="text-display font-semibold text-primary block leading-tight">
              {streakCount}
            </span>
            <span className="text-overline text-muted uppercase tracking-wide">
              Day Streak
            </span>
          </Card>
          <Card className="p-3 text-center">
            <span className="text-display font-semibold text-primary block leading-tight">
              {activeDaysCount}
            </span>
            <span className="text-overline text-muted uppercase tracking-wide">
              Active Days
            </span>
          </Card>
          <Card
            interactive
            onClick={onOpenLearnedWords}
            className="p-3 text-center cursor-pointer"
          >
            <span className="text-display font-semibold text-accent block leading-tight">
              {learnedCount}
            </span>
            <span className="text-overline text-muted uppercase tracking-wide">
              Words
            </span>
          </Card>
        </div>

        {/* Supabase Account & Cloud Sync */}
        {!isSupabaseConfigured ? (
          <Card className="p-4 bg-status-warning/10 text-status-warning text-caption space-y-1">
            <p className="font-semibold">Supabase sync not configured</p>
            <p className="text-overline">
              Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable cloud sync.
            </p>
          </Card>
        ) : user ? (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-success" />
                <span className="text-caption font-semibold text-primary">
                  Cloud Sync Active
                </span>
              </div>
              <span className="text-overline text-muted uppercase">
                {syncStatus === "syncing" ? "Syncing…" : "Synced"}
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={onForceSync}
                disabled={syncStatus === "syncing"}
                className="flex-1"
              >
                {syncStatus === "syncing" ? "Syncing…" : "Sync Now"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await onSignOut();
                  onClose();
                }}
                className="flex-1 text-status-error hover:bg-status-error/10"
              >
                Sign Out
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-5 space-y-4">
            <div className="space-y-1">
              <h4 className="text-headline font-semibold text-primary">
                {mode === "signin" ? "Sign In to Yappi" : "Create Account"}
              </h4>
              <p className="text-caption text-muted">
                Sync your streak, custom decks, and learned words across devices
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-status-error/10 text-status-error text-caption font-medium">
                {error}
              </div>
            )}
            {notice && (
              <div className="p-3 rounded-xl bg-accent/10 text-accent text-caption font-medium">
                {notice}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full mt-2"
              >
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError("");
                  setNotice("");
                }}
                className="text-caption text-accent hover:underline cursor-pointer"
              >
                {mode === "signin"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </Card>
        )}

        {/* Quick Links */}
        <div className="space-y-2 pt-2 border-t border-hairline">
          <Card
            interactive
            onClick={() => {
              onClose();
              onOpenLearnedWords?.();
            }}
            className="p-3.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Icon name="check" className="w-4 h-4 text-status-success" />
              <span className="text-body font-medium text-primary">Learned Vocabulary</span>
            </div>
            <span className="text-caption text-muted">{learnedCount} words →</span>
          </Card>

          <Card
            interactive
            onClick={() => {
              onClose();
              onOpenSettings?.();
            }}
            className="p-3.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Icon name="settings" className="w-4 h-4 text-muted" />
              <span className="text-body font-medium text-primary">App Preferences</span>
            </div>
            <Icon name="arrowRight" className="w-4 h-4 text-muted" />
          </Card>
        </div>
      </div>
    </Sheet>
  );
}
