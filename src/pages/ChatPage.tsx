import { useState, useRef, useEffect } from "react";
import { Send, Search, FileText, Terminal, Mic, ChevronDown, ChevronRight, Loader2, AlertCircle, Volume2, VolumeX, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendMessage, type Message, type StreamChunk } from "@/services/openclawApi";
import { 
  startRecording, 
  stopRecording, 
  transcribe, 
  SentenceBuffer, 
  StreamingTTSPlayer,
  createAudioVisualizer
} from "@/services/voiceService";

interface ToolCall {
  name: string;
  params: string;
  result?: string;
  status: "running" | "completed" | "failed";
}

interface ChatMessage {
  id: string;
  sender: "user" | "sol";
  content: string;
  timestamp: string;
  type: "text" | "thinking" | "tool_call" | "voice";
  toolCall?: ToolCall;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const toolIcons: Record<string, React.ReactNode> = {
  web_search: <Search className="h-3.5 w-3.5" />,
  file_download: <FileText className="h-3.5 w-3.5" />,
  exec_command: <Terminal className="h-3.5 w-3.5" />,
  read: <FileText className="h-3.5 w-3.5" />,
  write: <FileText className="h-3.5 w-3.5" />,
  exec: <Terminal className="h-3.5 w-3.5" />,
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
            <p className="font-mono text-xs text-foreground/80 whitespace-pre-wrap">{tc.params}</p>
          </div>
          {tc.result && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Result</span>
              <p className="font-mono text-xs text-foreground/80 whitespace-pre-wrap">{tc.result}</p>
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

function AudioVisualizer({ isRecording, isSpeaking }: { isRecording: boolean; isSpeaking: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  if (!isRecording && !isSpeaking) {
    return null;
  }
  
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-card border border-border rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-3">
          {isRecording && (
            <>
              <Mic className="h-4 w-4 text-sol animate-pulse" />
              <span className="text-xs text-muted-foreground">Listening...</span>
            </>
          )}
          {isSpeaking && (
            <>
              <Volume2 className="h-4 w-4 text-sol animate-pulse" />
              <span className="text-xs text-muted-foreground">Speaking...</span>
            </>
          )}
          <canvas 
            ref={canvasRef} 
            width="200" 
            height="40"
            className="rounded"
          />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [autoPlayTTS, setAutoPlayTTS] = useState(true);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationHistory = useRef<Message[]>([]);
  const sentenceBuffer = useRef(new SentenceBuffer());
  const ttsPlayer = useRef(new StreamingTTSPlayer());
  const visualizerCleanup = useRef<(() => void) | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Setup TTS player callbacks
  useEffect(() => {
    ttsPlayer.current.onComplete(() => {
      setIsSpeaking(false);
      
      // If voice mode is active, automatically start listening again
      if (voiceMode && !isStreaming) {
        setTimeout(() => {
          handleVoiceRecord().catch(err => {
            console.error("Auto-listen failed:", err);
            setVoiceMode(false); // Disable voice mode on error
          });
        }, 500); // Small delay before starting next recording
      }
    });

    ttsPlayer.current.onStart(() => {
      setIsSpeaking(true);
    });
  }, [voiceMode, isStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ttsPlayer.current.stop();
      if (visualizerCleanup.current) {
        visualizerCleanup.current();
      }
    };
  }, []);

  const handleVoiceRecord = async () => {
    if (isRecordingVoice) {
      // Stop recording
      try {
        setIsRecordingVoice(false);
        const audioBlob = await stopRecording();

        // Transcribe
        const transcribedText = await transcribe(audioBlob);

        if (transcribedText.trim()) {
          // Auto-send the transcribed message
          await handleSendMessage(transcribedText, true);
        } else {
          setError("No speech detected. Please try again.");
          
          // Retry in voice mode
          if (voiceMode) {
            setTimeout(() => handleVoiceRecord(), 1000);
          }
        }
      } catch (err) {
        console.error("Voice recording error:", err);
        setError(err instanceof Error ? err.message : "Failed to process voice input");
        setIsRecordingVoice(false);
        
        // Retry in voice mode unless permission denied
        if (voiceMode && !(err instanceof Error && err.message.includes("permission"))) {
          setTimeout(() => handleVoiceRecord(), 2000);
        } else if (err instanceof Error && err.message.includes("permission")) {
          setVoiceMode(false);
        }
      }
    } else {
      // Start recording
      try {
        setError(null);
        await startRecording();
        setIsRecordingVoice(true);
      } catch (err) {
        console.error("Failed to start recording:", err);
        setError(err instanceof Error ? err.message : "Failed to start recording");
        setIsRecordingVoice(false);
        
        if (err instanceof Error && err.message.includes("permission")) {
          setVoiceMode(false);
        }
      }
    }
  };

  const handleSendMessage = async (messageText?: string, fromVoice = false) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isStreaming) return;

    setInput("");
    setError(null);

    // Add user message to UI
    const userMsgId = Date.now().toString();
    const userChatMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
      type: fromVoice ? "voice" : "text",
    };
    setMessages((prev) => [...prev, userChatMsg]);

    // Add to conversation history for context
    conversationHistory.current.push({
      role: "user",
      content: userMessage,
    });

    setIsStreaming(true);

    // Add thinking indicator
    const thinkingId = `thinking-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: thinkingId,
        sender: "sol",
        content: "",
        timestamp: new Date().toISOString(),
        type: "thinking",
      },
    ]);

    let currentResponseId = "";
    let currentContent = "";
    let activeToolCalls = new Map<string, ToolCall>();

    // Reset sentence buffer and TTS player for new response
    sentenceBuffer.current.clear();
    ttsPlayer.current.stop();
    ttsPlayer.current.resume();

    try {
      await sendMessage(
        conversationHistory.current, 
        (chunk: StreamChunk) => {
          // Remove thinking indicator once we start getting real content
          if (chunk.type !== "thinking") {
            setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
          }

          switch (chunk.type) {
            case "content":
              if (chunk.content) {
                if (!currentResponseId) {
                  currentResponseId = `sol-${Date.now()}`;
                  currentContent = chunk.content;
                  setMessages((prev) => [
                    ...prev.filter((m) => m.id !== thinkingId),
                    {
                      id: currentResponseId,
                      sender: "sol",
                      content: currentContent,
                      timestamp: new Date().toISOString(),
                      type: "text",
                    },
                  ]);
                } else {
                  currentContent += chunk.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === currentResponseId ? { ...m, content: currentContent } : m
                    )
                  );
                }

                // STREAMING TTS: Extract complete sentences and play immediately
                if (autoPlayTTS) {
                  const sentences = sentenceBuffer.current.add(chunk.content);
                  if (sentences.length > 0) {
                    sentences.forEach(sentence => {
                      ttsPlayer.current.addSentence(sentence);
                    });
                  }
                }
              }
              break;

            case "tool_call":
              if (chunk.toolCall) {
                const toolId = chunk.toolCall.id || `tool-${Date.now()}-${chunk.toolCall.name}`;
                const existingTool = activeToolCalls.get(toolId);

                if (existingTool) {
                  // Update existing tool call params (streaming)
                  existingTool.params += chunk.toolCall.params;
                  activeToolCalls.set(toolId, existingTool);
                } else {
                  // New tool call
                  const newTool: ToolCall = {
                    name: chunk.toolCall.name,
                    params: chunk.toolCall.params,
                    status: "running",
                  };
                  activeToolCalls.set(toolId, newTool);

                  setMessages((prev) => [
                    ...prev.filter((m) => m.id !== thinkingId),
                    {
                      id: toolId,
                      sender: "sol",
                      content: "",
                      timestamp: new Date().toISOString(),
                      type: "tool_call",
                      toolCall: newTool,
                    },
                  ]);
                }

                // Update the message with current params
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === toolId && activeToolCalls.has(toolId)
                      ? { ...m, toolCall: activeToolCalls.get(toolId) }
                      : m
                  )
                );
              }
              break;

            case "tool_result":
              if (chunk.toolResult) {
                // Find and update the matching tool call
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.type === "tool_call" && m.toolCall?.name === chunk.toolResult!.name) {
                      return {
                        ...m,
                        toolCall: {
                          ...m.toolCall,
                          result: chunk.toolResult!.result,
                          status: "completed" as const,
                        },
                      };
                    }
                    return m;
                  })
                );
              }
              break;

            case "done":
              // Flush any remaining text in sentence buffer
              if (autoPlayTTS) {
                const remaining = sentenceBuffer.current.flush();
                if (remaining) {
                  ttsPlayer.current.addSentence(remaining);
                }
              }

              // Save assistant response to conversation history
              if (currentContent) {
                conversationHistory.current.push({
                  role: "assistant",
                  content: currentContent,
                });
              }
              setIsStreaming(false);
              break;

            case "error":
              setError(chunk.error || "An error occurred");
              setIsStreaming(false);
              setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
              break;
          }
        },
        { useVoiceModel: fromVoice } // Use voice model for voice conversations
      );
    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      setIsStreaming(false);
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    await handleSendMessage();
  };

  const toggleVoiceMode = async () => {
    if (voiceMode) {
      // Disable voice mode
      setVoiceMode(false);
      ttsPlayer.current.stop();
      if (isRecordingVoice) {
        await stopRecording().catch(console.error);
        setIsRecordingVoice(false);
      }
    } else {
      // Enable voice mode - start first recording
      setVoiceMode(true);
      setAutoPlayTTS(true); // Auto-enable TTS in voice mode
      await handleVoiceRecord();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex-1 overflow-auto px-4 py-4 space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <div className="text-4xl">☀️</div>
              <p className="text-sm">Sol is ready. Send a message to get started.</p>
              <p className="text-xs text-muted-foreground">
                Try voice mode for hands-free conversation
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
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
        <div ref={messagesEndRef} />
      </div>

      {/* Audio Visualizer */}
      <AudioVisualizer isRecording={isRecordingVoice} isSpeaking={isSpeaking} />

      {/* Input Area */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex gap-2 items-center">
          {/* Voice Mode Toggle */}
          <Button
            size="icon"
            variant={voiceMode ? "default" : "ghost"}
            className={`flex-shrink-0 ${voiceMode ? "bg-sol hover:bg-sol/90" : ""}`}
            onClick={toggleVoiceMode}
            disabled={isStreaming}
            title={voiceMode ? "Voice mode active - continuous conversation" : "Enable voice mode"}
          >
            <Radio className={`h-4 w-4 ${voiceMode ? "animate-pulse" : ""}`} />
          </Button>

          {/* TTS Toggle */}
          <Button
            size="icon"
            variant="ghost"
            className="flex-shrink-0"
            onClick={() => setAutoPlayTTS(!autoPlayTTS)}
            title={autoPlayTTS ? "Auto-play TTS enabled" : "Auto-play TTS disabled"}
          >
            {autoPlayTTS ? (
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          {/* Text Input */}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              voiceMode 
                ? "Voice mode active..." 
                : isRecordingVoice 
                ? "Recording..." 
                : "Message Sol..."
            }
            className="flex-1 bg-secondary border-border"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isStreaming || isRecordingVoice || voiceMode}
          />

          {/* Manual Mic Button (hidden in voice mode) */}
          {!voiceMode && (
            <Button
              size="icon"
              variant={isRecordingVoice ? "destructive" : "ghost"}
              className={`flex-shrink-0 ${isRecordingVoice ? "animate-pulse" : ""}`}
              onClick={handleVoiceRecord}
              disabled={isStreaming}
              title={isRecordingVoice ? "Stop recording" : "Start voice recording"}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}

          {/* Send Button (hidden in voice mode) */}
          {!voiceMode && (
            <Button
              size="icon"
              className="bg-primary hover:bg-primary/90 flex-shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming || isRecordingVoice}
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
