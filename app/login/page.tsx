"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-8 border border-zinc-800">
        <h1 className="text-3xl font-bold text-white mb-2">GlamourOS</h1>
        <p className="text-zinc-400 mb-8">Sign in to continue</p>

        <label className="block text-sm text-zinc-300 mb-2">Email</label>
        <input
          type="email"
          placeholder="email@example.com"
          className="w-full mb-5 p-3 rounded-lg bg-zinc-800 text-white placeholder:text-zinc-500 border border-zinc-700 focus:outline-none focus:border-pink-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block text-sm text-zinc-300 mb-2">Password</label>
        <input
          type="password"
          placeholder="••••••••"
          className="w-full mb-6 p-3 rounded-lg bg-zinc-800 text-white placeholder:text-zinc-500 border border-zinc-700 focus:outline-none focus:border-pink-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full rounded-lg bg-pink-600 hover:bg-pink-700 text-white p-3 font-medium disabled:opacity-60"
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </div>
    </div>
  );
}