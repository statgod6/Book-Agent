"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { BookOpen, Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    // Redirect if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = "/dashboard";
    });
  }, [supabase]);

  const handleAuth = async () => {
    setLoading(true);
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage("Check your email to confirm your account!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setMessage(error.message);
      else window.location.href = "/dashboard";
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#16213e] to-[#0a0a1a]">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="w-10 h-10 text-accent" />
            <h1 className="text-4xl font-bold text-white">
              Book<span className="text-accent">Mind</span>
            </h1>
          </div>
          <p className="text-gray-400 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            Read smarter with AI by your side
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface/50 backdrop-blur-xl rounded-2xl p-8 border border-white/5">
          <h2 className="text-xl font-semibold text-white mb-6">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-ink/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent transition placeholder:text-gray-600"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-ink/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent transition placeholder:text-gray-600"
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              />
            </div>

            {message && (
              <p
                className={`text-sm ${
                  message.includes("Check")
                    ? "text-green-400"
                    : "text-accent"
                }`}
              >
                {message}
              </p>
            )}

            <button
              onClick={handleAuth}
              disabled={loading || !email || !password}
              className="w-full py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Sign Up" : "Sign In"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage("");
              }}
              className="text-accent hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
