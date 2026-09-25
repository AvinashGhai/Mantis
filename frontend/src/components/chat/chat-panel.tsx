"use client";

import { useEffect, useRef } from "react";
import { Activity, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./message-bubble";
import { ChatComposer } from "./chat-composer";
import { ChatMessage, Attachment, Product } from "@/lib/types";

interface ChatPanelProps {
  product: Product;
  messages: ChatMessage[];
  onSend: (text: string, attachments: Attachment[]) => void;
  onQuickReply: (reply: string) => void;
  awaitingReply: boolean;
  onToggleDiagnostics: () => void;
}

export function ChatPanel({
  product,
  messages,
  onSend,
  onQuickReply,
  awaitingReply,
  onToggleDiagnostics,
}: ChatPanelProps) {
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  // STABLE AUTO-SCROLL LOGIC
  useEffect(() => {
    // Small delay ensures that the React DOM has updated 
    // and the new message bubble is actually rendered on screen
    const timer = setTimeout(() => {
      if (scrollAnchorRef.current) {
        scrollAnchorRef.current.scrollIntoView({ 
          behavior: "smooth", 
          block: "end" 
        });
      }
    }, 100);

    return () => clearTimeout(timer);
    
    // CRITICAL: We use messages.length instead of just messages.
    // Comparing numbers (length) prevents the "[object Object]" error 
    // caused by unstable object references during DevTools refreshes.
  }, [messages.length, awaitingReply]); 

  const lastIndex = messages.length - 1;

  return (
    <div className="flex h-full flex-col bg-canvas bg-grid overflow-hidden border-r border-line/30">
      {/* TECHNICAL HEADER */}
      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface/70 px-5 py-4 backdrop-blur shrink-0 z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted">
              {product.category} // Live_Link
            </p>
          </div>
          <h1 className="font-display text-lg font-bold text-text tracking-tight mt-0.5">
            {product.name}
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleDiagnostics}
          className="border-line bg-transparent text-text hover:border-signal hover:text-signal lg:hidden flex gap-2 h-9 px-3"
        >
          <Activity className="h-4 w-4" />
          <span className="text-[10px] uppercase font-mono font-bold">Diagnostics</span>
        </Button>
      </header>

      {/* SCROLLABLE MESSAGE AREA */}
      <ScrollArea className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-8 px-5 py-8 min-h-full">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id || index}
              message={message}
              onQuickReply={onQuickReply}
              // Prevent clicking replies on old bubbles or while AI is busy
              disableQuickReplies={awaitingReply || index !== lastIndex}
            />
          ))}

          {/* AI THINKING STATE */}
          {awaitingReply && (
            <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="bg-surface-2 p-4 rounded-2xl border border-line flex items-center gap-3 shadow-xl">
                <Loader2 className="h-3 w-3 animate-spin text-signal" />
                <span className="text-[10px] font-mono text-signal uppercase tracking-[0.2em] animate-pulse">
                  Analyzing_Manufacturer_RAG_Graph...
                </span>
              </div>
            </div>
          )}

          {/* INVISIBLE SCROLL ANCHOR */}
          <div ref={scrollAnchorRef} className="h-2 w-full shrink-0" aria-hidden="true" />
        </div>
      </ScrollArea>

      {/* INPUT / COMPOSER */}
      <div className="p-4 bg-canvas/90 backdrop-blur-sm border-t border-line shrink-0">
        <ChatComposer onSend={onSend} disabled={awaitingReply} />
        <div className="mt-3 flex justify-center items-center gap-4 opacity-30">
            <div className="h-[1px] w-12 bg-line" />
            <p className="text-[8px] font-mono text-text-muted uppercase tracking-[0.4em]">
                Mantis // Expert_Technician_Protocol
            </p>
            <div className="h-[1px] w-12 bg-line" />
        </div>
      </div>
    </div>
  );
}