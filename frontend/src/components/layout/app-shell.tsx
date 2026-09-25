"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, ArrowLeft, RotateCcw, Loader2, ShieldCheck } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { DiagnosticPanel } from "@/components/diagnostics/diagnostic-panel";
import { ProductSidebar } from "./product-sidebar";
import { INITIAL_DIAGNOSTIC_STATE, INITIAL_MESSAGES, PRODUCTS } from "@/lib/mock-data";
import { Attachment, ChatMessage, Product, DiagnosticState } from "@/lib/types";

function nowTime() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

interface AppShellProps {
  onBack?: () => void;
  activeUnit?: any; 
  registeredUnits?: any[]; 
}

export function AppShell({ onBack, activeUnit, registeredUnits = [] }: AppShellProps) {
  // --- STATE ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [diagnostic, setDiagnostic] = useState<DiagnosticState>(INITIAL_DIAGNOSTIC_STATE);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [diagnosticVisible, setDiagnosticVisible] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);

  // --- SYNC PRODUCT CONTEXT ---
  useEffect(() => {
    if (activeUnit) {
      handleSwitchProduct(activeUnit);
    }
  }, [activeUnit]);

  // Helper to switch context cleanly
  const handleSwitchProduct = (unit: any) => {
    const productContext: Product = {
      id: unit.productId || "ac", 
      name: unit.productName,
      category: unit.category,
      icon: unit.iconName || "Cpu",
      lastService: unit.lastServiceDate,
      nextService: "Scheduled"
    };
    setSelectedProduct(productContext);
    handleReset(); // Clear old chat and history
  };

  // --- API HANDLER ---
  const handleSend = async (text: string, attachments: Attachment[]) => {
    if (!text && attachments.length === 0) return;
    if (awaitingReply || !selectedProduct) return;

    // 1. Add User Msg
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text,
        time: nowTime(),
        attachments: attachments.length > 0 ? attachments : undefined,
      },
    ]);

    setAwaitingReply(true);

    try {
      const formData = new FormData();
      formData.append("query", text);
      formData.append("user_id", "alex_01");
      
      if (conversationId) formData.append("conversation_id", conversationId);
      
      if (attachments.length > 0 && attachments[0].file) {
        formData.append("image", attachments[0].file);
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/chat/${selectedProduct.id}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Offline");
      
      const data = await res.json();

      if (data.conversation_id) setConversationId(data.conversation_id);
      
      // Use 'answer' as identified in your backend JSON logs
      const aiResponseText = data.answer || data.response || "Inference complete.";
      
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: "assistant",
          text: aiResponseText,
          time: nowTime(),
          quickReplies: data.quick_replies,
        },
      ]);
      
      setDiagnostic((prev) => ({
          ...prev,
          confidence: Math.min(prev.confidence + 18, 98),
          status: "diagnosing",
          symptom: text.length > 20 ? text.substring(0, 20) + "..." : text,
          sources: data.sources && data.sources.length > 0 ? data.sources : prev.sources
      }));

    } catch (err) {
      setMessages((prev) => [...prev, {
        id: 'err', sender: 'assistant', time: nowTime(),
        text: "🚨 BACKEND_ERROR: AI Model on port 8000 is unreachable."
      }]);
    } finally {
      setAwaitingReply(false);
    }
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
    setDiagnostic(INITIAL_DIAGNOSTIC_STATE);
    setConversationId(null);
    setAwaitingReply(false);
    setEscalated(false);
  };

  const handleEscalate = () => {
    setEscalated(true);
    setDiagnostic((prev) => ({ ...prev, status: "escalated" }));
    setMessages((prev) => [...prev, {
        id: `esc-${Date.now()}`,
        sender: "assistant",
        text: "UNIT_ESCALATED: A Mantis engineer has been notified. Ticket #TQ-091 assigned.",
        time: nowTime()
    }]);
  };

  if (!selectedProduct) {
      return (
        <div className="h-full flex items-center justify-center bg-canvas text-text-faint font-mono animate-pulse">
            BOOTING_DIAGNOSTIC_KERNEL...
        </div>
      )
  }

  return (
    <div className="flex h-full flex-col bg-canvas text-text relative overflow-hidden">
      
      {/* MOBILE NAV */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-line bg-surface/30 lg:hidden shrink-0">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-xs text-text-muted hover:text-signal transition-colors font-mono">
            <ArrowLeft size={14} /> EXIT
          </button>
        )}
        <div className="flex items-center gap-2 font-mono text-[10px] text-signal uppercase">
            <div className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
            Live_Inference
        </div>
      </div>

      <main className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_1fr_380px]">
        
        {/* SIDEBAR: Implementing Switching Logic */}
        <div className="hidden border-r border-line lg:block bg-surface/20">
          <ProductSidebar
            products={registeredUnits.length > 0 ? registeredUnits : PRODUCTS}
            selected={selectedProduct}
            onSelect={(unit: any) => handleSwitchProduct(unit)}
            onReset={handleReset}
          />
        </div>

        {/* CHAT PANEL */}
        <div className="flex flex-col min-w-0 bg-canvas relative overflow-hidden border-r border-line/30">
          <ChatPanel
            product={selectedProduct}
            messages={messages}
            onSend={handleSend}
            onQuickReply={(reply: string) => handleSend(reply, [])}
            awaitingReply={awaitingReply}
            onToggleDiagnostics={() => setDiagnosticVisible((prev) => !prev)}
          />
        </div>

        {/* DIAGNOSTIC PANEL */}
        {diagnosticVisible && (
          <div className="hidden h-full flex-col border-l border-line bg-surface/10 lg:flex overflow-y-auto relative bg-grid">
            <div className="px-6 pt-6 shrink-0 flex justify-between items-center">
                {onBack && (
                <button 
                    onClick={onBack}
                    className="group flex items-center gap-2 text-[10px] font-mono text-text-muted hover:text-signal transition-colors uppercase"
                >
                    <ArrowLeft size={10} className="group-hover:-translate-x-1 transition-transform" /> 
                    Exit_Session
                </button>
                )}
                <ShieldCheck size={14} className="text-confirm opacity-40" />
            </div>
            
            <div className="flex-1">
                <DiagnosticPanel
                    diagnostic={diagnostic}
                    onEscalate={handleEscalate}
                    escalated={escalated}
                />
            </div>
            
            <div className="mt-auto p-6 border-t border-line bg-canvas/40 backdrop-blur-sm">
               <button 
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-line text-[10px] font-bold text-text-faint hover:text-text transition-all bg-surface/50 uppercase tracking-widest"
               >
                 <RotateCcw size={12} /> Flush_Context_Buffer
               </button>
            </div>
          </div>
        )}
      </main>

      {!diagnosticVisible && (
        <button 
          onClick={() => setDiagnosticVisible(true)}
          className="fixed bottom-24 right-6 lg:hidden bg-signal text-canvas p-4 rounded-full shadow-2xl z-50 animate-bounce"
        >
          <Activity size={24} />
        </button>
      )}
    </div>
  );
}