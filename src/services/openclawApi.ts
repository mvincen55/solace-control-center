/**
 * OpenClaw Gateway API Service
 * Handles communication with the OpenClaw backend via the chat completions endpoint
 * Also provides OpenAI voice services (Whisper STT, TTS)
 */

// In dev, Vite proxies /v1/* to the gateway (see vite.config.ts)
// In production, set VITE_OPENCLAW_URL to the gateway address
const GATEWAY_URL = import.meta.env.VITE_OPENCLAW_URL || "";
const AUTH_TOKEN = import.meta.env.VITE_OPENCLAW_TOKEN || "";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const VOICE_MODEL = import.meta.env.VITE_VOICE_MODEL || "openclaw:main";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamChunk {
  type: "content" | "thinking" | "tool_call" | "tool_result" | "done" | "error";
  content?: string;
  toolCall?: {
    name: string;
    params: string;
    id?: string;
  };
  toolResult?: {
    name: string;
    result: string;
  };
  error?: string;
}

export type StreamCallback = (chunk: StreamChunk) => void;

/**
 * Send a message to OpenClaw and stream the response
 */
export async function sendMessage(
  messages: Message[],
  onChunk: StreamCallback,
  options?: { useVoiceModel?: boolean }
): Promise<void> {
  if (!AUTH_TOKEN) {
    onChunk({
      type: "error",
      error: "Missing authentication token. Please set VITE_OPENCLAW_TOKEN in your .env file.",
    });
    return;
  }

  try {
    const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        model: options?.useVoiceModel ? VOICE_MODEL : "openclaw:main",
        messages,
        stream: true,
        user: "solace-control-center", // Stable user ID for session persistence
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gateway returned ${response.status}: ${errorText}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim() || line.startsWith(":")) continue;
        if (!line.startsWith("data: ")) continue;

        const data = line.slice(6); // Remove "data: " prefix
        if (data === "[DONE]") {
          onChunk({ type: "done" });
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;

          if (!delta) continue;

          // Content chunk
          if (delta.content) {
            onChunk({
              type: "content",
              content: delta.content,
            });
          }

          // Tool call (OpenAI format)
          if (delta.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              if (toolCall.function) {
                onChunk({
                  type: "tool_call",
                  toolCall: {
                    id: toolCall.id,
                    name: toolCall.function.name,
                    params: toolCall.function.arguments || "",
                  },
                });
              }
            }
          }
        } catch (parseError) {
          console.warn("Failed to parse SSE chunk:", data, parseError);
        }
      }
    }

    onChunk({ type: "done" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("OpenClaw API error:", error);
    
    // Provide helpful error messages
    if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
      onChunk({
        type: "error",
        error: `Cannot connect to OpenClaw Gateway at ${GATEWAY_URL}. Is it running? Check with: openclaw gateway status`,
      });
    } else if (errorMessage.includes("401") || errorMessage.includes("403")) {
      onChunk({
        type: "error",
        error: "Authentication failed. Check your VITE_OPENCLAW_TOKEN in .env matches the token in your OpenClaw config.",
      });
    } else if (errorMessage.includes("404")) {
      onChunk({
        type: "error",
        error: "Chat completions endpoint not found. Make sure 'gateway.chatCompletions.enabled: true' in your OpenClaw config.",
      });
    } else {
      onChunk({
        type: "error",
        error: errorMessage,
      });
    }
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OpenAI API key. Please set VITE_OPENAI_API_KEY in your .env file.");
  }

  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result.text || "";
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Whisper API error:", error);
    
    if (errorMessage.includes("401") || errorMessage.includes("403")) {
      throw new Error("OpenAI authentication failed. Check your VITE_OPENAI_API_KEY in .env");
    } else {
      throw new Error(`Transcription failed: ${errorMessage}`);
    }
  }
}

/**
 * Convert text to speech using OpenAI TTS API
 */
export async function textToSpeech(text: string): Promise<Blob> {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OpenAI API key. Please set VITE_OPENAI_API_KEY in your .env file.");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "onyx",
        input: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS API returned ${response.status}: ${errorText}`);
    }

    return await response.blob();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("TTS API error:", error);
    
    if (errorMessage.includes("401") || errorMessage.includes("403")) {
      throw new Error("OpenAI authentication failed. Check your VITE_OPENAI_API_KEY in .env");
    } else {
      throw new Error(`TTS failed: ${errorMessage}`);
    }
  }
}

/**
 * Test the connection to the OpenClaw Gateway
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${GATEWAY_URL}/v1/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    });

    if (response.ok) {
      return { success: true, message: "Connected to OpenClaw Gateway" };
    } else {
      return { success: false, message: `Gateway returned ${response.status}` };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
