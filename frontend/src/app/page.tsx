"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { CustomerGarage } from "@/components/customer/customer-garage";
import { CompanyDashboard } from "@/components/company/company-dashboard";
import { UserCircle, LogOut, ShieldCheck, Lock, Loader2 } from "lucide-react";

// Helper component to handle search params safely in Next.js
function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [role, setRole] = useState<"customer" | "company" | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  
  // NEW: State to store the specific machine selected for repair
  const [activeUnit, setActiveUnit] = useState<any>(null);

  useEffect(() => {
    // Check localStorage first to persist session
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsLoggedIn(true);
        setRole(parsedUser.role);
        return;
      } catch (e) {
        console.error("Failed to parse user from storage", e);
      }
    }

    const roleParam = searchParams.get("role");
    const authParam = searchParams.get("authenticated");

    if (authParam === "true" && roleParam) {
      setIsLoggedIn(true);
      setRole(roleParam as any);
    }
  }, [searchParams]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole(null);
    setActiveUnit(null);
    setIsRepairing(false);
    setUser(null);
    localStorage.removeItem("user");
    // Clear user_session cookie
    document.cookie = "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.push("/login");
  };

  // --- 1. UNAUTHENTICATED / PROTECTED STATE ---
  if (!isLoggedIn) {
    return (
      <div className="h-screen bg-canvas flex flex-col items-center justify-center text-center p-6 bg-grid">
        <div className="bg-surface-2 p-6 rounded-3xl border border-line mb-6 shadow-2xl">
            <Lock size={40} className="text-text-muted" />
        </div>
        <h1 className="text-2xl font-display font-bold text-text mb-2 tracking-tight">Protected Node Gateway</h1>
        <p className="text-text-muted mb-8 max-w-xs text-sm">Authentication is required to access specialized diagnostic clusters.</p>
        <button 
          onClick={() => router.push("/login")}
          className="bg-signal text-canvas font-bold px-10 py-3 rounded-xl hover:scale-105 transition-all shadow-lg shadow-signal/20"
        >
          Return to Login
        </button>
      </div>
    );
  }

  // --- 2. CUSTOMER ROLE ---
  if (role === "customer") {
    return (
      <div className="flex h-screen flex-col bg-canvas text-text overflow-hidden">
        <header className="flex items-center justify-between border-b border-line px-6 py-3 bg-surface/50 shrink-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="bg-signal text-canvas font-bold px-2 py-0.5 rounded text-sm uppercase tracking-tighter">Mantis</div>
            <span className="text-text-muted text-[10px] font-mono uppercase tracking-[0.2em] hidden sm:block border-l border-line pl-3">Garage_Portal</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-text-muted font-medium pr-4 border-r border-line">
              <UserCircle size={18} className="text-signal/60" />
              <span className="hidden xs:inline">{user?.name || "Alex M."}</span>
            </div>
            <button 
                onClick={handleLogout} 
                className="text-text-faint hover:text-alert flex items-center gap-2 text-[10px] font-bold font-mono transition-colors"
            >
              <LogOut size={14} /> SIGN_OUT
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          {isRepairing ? (
            // FIX: Pass the activeUnit so AppShell knows which FastAPI model to use
            <AppShell 
                activeUnit={activeUnit} 
                onBack={() => {
                    setIsRepairing(false);
                    setActiveUnit(null);
                }} 
            />
          ) : (
            // FIX: Capture the unit when the user clicks the repair button
            <CustomerGarage 
                onStartRepair={(unit) => {
                    setActiveUnit(unit);
                    setIsRepairing(true);
                }} 
            />
          )}
        </main>
      </div>
    );
  }

  // --- 3. COMPANY ADMIN ROLE ---
  if (role === "company") {
    return (
      <div className="flex h-screen flex-col bg-canvas text-text overflow-hidden">
        <header className="flex items-center justify-between border-b border-line px-6 py-4 bg-surface shrink-0 z-20 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="bg-confirm text-canvas font-bold px-2 py-0.5 rounded text-sm italic uppercase tracking-tighter">Mantis</div>
            <span className="text-confirm text-[10px] font-mono uppercase tracking-[0.4em] border-l border-confirm/30 pl-3">HQ_ADMIN_STRATOR</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-confirm/60 font-mono">
                <ShieldCheck size={14} /> ENCRYPTION_ACTIVE
            </div>
            <button 
                onClick={handleLogout} 
                className="bg-alert/10 text-alert border border-alert/20 px-4 py-1.5 rounded-lg text-[10px] font-bold hover:bg-alert hover:text-white transition-all uppercase tracking-widest font-mono"
            >
              Secure_Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <CompanyDashboard />
        </main>
      </div>
    );
  }

  return null;
}

// Main component with Suspense boundary (required for useSearchParams in Next.js)
export default function Home() {
  return (
    <Suspense fallback={
        <div className="h-screen bg-canvas flex items-center justify-center">
            <Loader2 className="animate-spin text-signal" size={32} />
        </div>
    }>
      <HomeContent />
    </Suspense>
  );
}