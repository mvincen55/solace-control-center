import { useState } from "react";
import { Send, Search, FileText, Terminal, Mic, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { mockMessages, type ChatMessage } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const toolIcons: Record<string, React.ReactNode> = {
  web_search: <Search className="h-3.5 w-3.5" />,
  file_download: <FileText className="h-3.5 w-3.5" />,
  exec_command: <Terminal className="h-3.5 w-3.5" />,
};

function ToolCallCard({ msg }: { msg: ChatMessage }) {
  const [open, setOpen] = useState(false);
  const tc = msg.toolCall!;

  return (
    <div className="my-1.5 rounded-md border border-border bg-secondary/50 overflow-hidden text-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent/50 transition-colors text-left"
      >
        {toolIcons[tc.name] || <Terminal className="h-3.5 w-3.5" />}
        <span className="font-mono text-xs font-medium">{tc.name}</span>
        <span
          className={`ml-auto text-[10px] font-semibold uppercase tracking-wider ${
            tc.status === "running"
              ? "text-sol"
              : tc.status === "completed"
              ? "text-success"
              : "text-destructive"
          }`}
        >
          {tc.status === "running" && <Loader2 className="h-3 w-3 animate-spin inline mr-1" />}
          {tc.status}
        </span>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 pb-2.5 border-t border-border pt-2 space-y-1.5">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Params</span>
            <p className="font-mono text-xs text-foreground/80">{tc.params}</p>
          </div>
          {tc.result && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Result</span>
              <p className="font-mono text-xs text-foreground/80">{tc.result}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-sol animate-pulse-glow"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground ml-1">Sol is thinking...</span>
    </div>
  );
}

function VoiceBubble({ timestamp }: { timestamp: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary border border-border">
      <Mic className="h-4 w-4 text-sol" />
      <div className="flex gap-0.5 items-center">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-sol/60 rounded-full"
            style={{ height: `${8 + Math.random() * 16}px` }}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground ml-auto">{formatTime(timestamp)}</span>
    </div>
  );
}

export default function ChatPage() {
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {mockMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[75%] ${msg.sender === "user" ? "" : ""}`}>
                {msg.type === "thinking" && <ThinkingBubble />}
                {msg.type === "tool_call" && <ToolCallCard msg={msg} />}
                {msg.type === "voice" && <VoiceBubble timestamp={msg.timestamp} />}
                {msg.type === "text" && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div
                      className={`text-[10px] mt-1.5 ${
                        msg.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Sol..."
            className="flex-1 bg-secondary border-border"
            onKeyDown={(e) => e.key === "Enter" && setInput("")}
          />
          <Button size="icon" className="bg-primary hover:bg-primary/90">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
