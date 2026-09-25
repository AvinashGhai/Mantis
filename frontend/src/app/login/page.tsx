"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wrench, ShieldCheck, UserCircle, ArrowRight, Loader2, Mail, ArrowLeft, KeyRound } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [role, setRole] = useState<"customer" | "company">("customer");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  // Messages
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (authMode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("user", JSON.stringify(data.user));
          router.push(`/?role=${data.user.role}&authenticated=true`);
        } else {
          setErrorMsg(data.error || "Signup failed");
        }
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }),
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("user", JSON.stringify(data.user));
          router.push(`/?role=${data.user.role}&authenticated=true`);
        } else {
          setErrorMsg(data.error || "Login failed");
        }
      }
    } catch (err) {
      console.error("Auth submit error:", err);
      setErrorMsg("An unexpected error occurred. Please check database connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const endpoint = authMode === "signup" ? "/api/auth/verify-signup" : "/api/auth/verify-login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push(`/?role=${data.user.role}&authenticated=true`);
      } else {
        setErrorMsg(data.error || "Verification failed");
      }
    } catch (err) {
      console.error("Verification submit error:", err);
      setErrorMsg("An error occurred during verification. Please check your code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setIsVerifying(false);
    setOtp("");
    setErrorMsg("");
    setSuccessMsg("");
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 bg-grid">
      
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-xl bg-signal flex items-center justify-center">
          <Wrench className="text-canvas" size={28} />
        </div>
        <h1 className="text-3xl font-display font-bold tracking-tighter text-text">MANTIS</h1>
      </div>

      <Card className="w-full max-w-md bg-surface border-line shadow-2xl relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-canvas/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-signal" size={36} />
            <p className="text-sm font-mono text-text-muted uppercase tracking-widest">
              {isVerifying ? "Confirming Code..." : "Processing request..."}
            </p>
          </div>
        )}

        {/* Status Messages */}
        {errorMsg && (
          <div className="bg-alert/10 border border-alert/20 text-alert p-3 text-xs font-semibold text-center uppercase tracking-wider font-mono">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-confirm/10 border border-confirm/20 text-confirm p-3 text-xs font-semibold text-center uppercase tracking-wider font-mono">
            {successMsg}
          </div>
        )}

        {!isVerifying ? (
          <>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-6">
                <div className="flex bg-surface-2 p-1 rounded-xl border border-line w-full">
                  <button
                    type="button"
                    onClick={() => setRole("customer")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      role === "customer" ? "bg-signal text-canvas" : "text-text-muted hover:text-text"
                    }`}
                  >
                    <UserCircle size={14} /> Customer Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("company")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      role === "company" ? "bg-confirm text-canvas" : "text-text-muted hover:text-text"
                    }`}
                  >
                    <ShieldCheck size={14} /> Admin Login
                  </button>
                </div>
              </div>

              <CardTitle className="text-2xl font-display font-bold">
                {role === "customer" ? "User Portal" : "Manufacturer Admin"}
              </CardTitle>
              <p className="text-xs font-mono text-text-muted mt-1 uppercase tracking-wider">
                {authMode === "signin" ? "Sign in to access your dashboard" : "Register a new secure node"}
              </p>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                {authMode === "signup" && (
                  <Input 
                    type="text" 
                    placeholder="Full Name" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 border-line bg-surface" 
                  />
                )}
                <Input 
                  type="email" 
                  placeholder="Email Address" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-line bg-surface" 
                />
                <Input 
                  type="password" 
                  placeholder="Password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-line bg-surface" 
                />
                <Button 
                  type="submit" 
                  className={`w-full h-12 font-bold text-canvas gap-2 cursor-pointer ${
                    role === 'customer' ? 'bg-signal' : 'bg-confirm'
                  }`}
                >
                  {authMode === "signin" ? "Sign In" : "Register"}{" "}
                  <ArrowRight size={18} />
                </Button>
              </form>

              <div className="text-center text-xs">
                {authMode === "signin" ? (
                  <p className="text-text-muted">
                    Don't have an account?{" "}
                    <button 
                      type="button" 
                      onClick={() => {
                        setAuthMode("signup");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="font-bold underline cursor-pointer hover:text-text transition-colors"
                    >
                      Sign Up
                    </button>
                  </p>
                ) : (
                  <p className="text-text-muted">
                    Already registered?{" "}
                    <button 
                      type="button" 
                      onClick={() => {
                        setAuthMode("signin");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="font-bold underline cursor-pointer hover:text-text transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-signal/10 flex items-center justify-center text-signal">
                  <KeyRound size={24} />
                </div>
              </div>
              <CardTitle className="text-2xl font-display font-bold">Verification Required</CardTitle>
              <p className="text-xs font-mono text-text-muted mt-1 uppercase tracking-wider">
                We sent a 6-digit OTP code to: <br/>
                <span className="text-text font-bold lowercase font-sans">{email}</span>
              </p>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div className="flex items-center gap-2 border border-line rounded-lg bg-surface px-3 focus-within:border-signal transition-all">
                  <Mail className="text-text-faint" size={18} />
                  <Input 
                    type="text" 
                    placeholder="Enter 6-digit OTP Code" 
                    required 
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-center font-mono font-bold tracking-widest text-lg" 
                  />
                </div>

                <Button 
                  type="submit" 
                  className={`w-full h-12 font-bold text-canvas gap-2 cursor-pointer ${
                    role === 'customer' ? 'bg-signal' : 'bg-confirm'
                  }`}
                >
                  Verify Code & Enter <ArrowRight size={18} />
                </Button>
              </form>

              <div className="flex items-center justify-between text-xs">
                <button 
                  type="button" 
                  onClick={handleBackToCredentials}
                  className="flex items-center gap-1.5 text-text-muted hover:text-text font-semibold font-mono cursor-pointer transition-colors"
                >
                  <ArrowLeft size={14} /> BACK
                </button>

                <button 
                  type="button" 
                  onClick={handleCredentialsSubmit}
                  className="text-text-muted hover:text-text font-semibold font-mono cursor-pointer transition-colors"
                >
                  RESEND CODE
                </button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}