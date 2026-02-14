export type AgentTier = "sol" | "opus" | "sonnet" | "haiku";

export interface ChatMessage {
  id: string;
  sender: "user" | "sol";
  content: string;
  timestamp: string;
  type: "text" | "thinking" | "tool_call" | "voice";
  toolCall?: {
    name: string;
    params: string;
    result?: string;
    status: "running" | "completed" | "failed";
  };
}

export interface Agent {
  id: string;
  name: string;
  tier: AgentTier;
  model: string;
  emoji: string;
  status: "active" | "idle" | "offline";
  currentTask?: string;
  sessionCount: number;
  totalTokens: number;
}

export interface AgentSession {
  id: string;
  agentId: string;
  agentTier: AgentTier;
  agentName: string;
  taskDescription: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  tokensUsed: number;
  cost: number;
}

export interface UsageRecord {
  date: string;
  opus: number;
  sonnet: number;
  haiku: number;
  total: number;
}

export interface ModelUsage {
  model: string;
  tier: AgentTier;
  inputTokens: number;
  outputTokens: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
}

export const mockMessages: ChatMessage[] = [
  {
    id: "1",
    sender: "user",
    content: "Hey Sol, can you look into the latest episode of the Kirk documentary?",
    timestamp: "2025-02-14T10:23:00Z",
    type: "text",
  },
  {
    id: "2",
    sender: "sol",
    content: "",
    timestamp: "2025-02-14T10:23:05Z",
    type: "thinking",
  },
  {
    id: "3",
    sender: "sol",
    content: "",
    timestamp: "2025-02-14T10:23:08Z",
    type: "tool_call",
    toolCall: {
      name: "web_search",
      params: '"Kirk documentary" latest episode 2025',
      result: "Found 3 results: Episode 12 aired Feb 10, transcript available on archive.org...",
      status: "completed",
    },
  },
  {
    id: "4",
    sender: "sol",
    content: "I found Episode 12 — it aired on Feb 10th. I've located the transcript on archive.org. Want me to download and analyze it for claims and key figures?",
    timestamp: "2025-02-14T10:23:15Z",
    type: "text",
  },
  {
    id: "5",
    sender: "user",
    content: "Yes, download and extract all claims made about the incident timeline.",
    timestamp: "2025-02-14T10:24:00Z",
    type: "text",
  },
  {
    id: "6",
    sender: "sol",
    content: "",
    timestamp: "2025-02-14T10:24:03Z",
    type: "tool_call",
    toolCall: {
      name: "file_download",
      params: "https://archive.org/kirk-ep12-transcript.txt",
      result: "Downloaded 48KB transcript to workspace/transcripts/kirk-ep12.txt",
      status: "completed",
    },
  },
  {
    id: "7",
    sender: "sol",
    content: "",
    timestamp: "2025-02-14T10:24:10Z",
    type: "tool_call",
    toolCall: {
      name: "exec_command",
      params: "python scripts/extract_claims.py transcripts/kirk-ep12.txt",
      status: "running",
    },
  },
  {
    id: "8",
    sender: "sol",
    content: "I've dispatched the Sonnet Analyst to extract claims from the transcript. It's processing now — I'll have the results shortly.",
    timestamp: "2025-02-14T10:24:15Z",
    type: "text",
  },
  {
    id: "9",
    sender: "sol",
    content: "",
    timestamp: "2025-02-14T10:25:00Z",
    type: "voice",
  },
  {
    id: "10",
    sender: "sol",
    content: "Analysis complete. I extracted 14 unique claims about the incident timeline from Episode 12. 3 contradict claims from Episode 8. Here's a summary:\n\n1. **New witness testimony** places the event at 2:30 AM, not 3:15 AM as previously stated\n2. **Security footage gap** — 47 minutes unaccounted for between camera 3 and camera 7\n3. **Phone records** show two calls to an unlisted number during the gap\n\nI've saved the full analysis to `workspace/analysis/kirk-ep12-claims.md`. Want me to cross-reference these with the master timeline?",
    timestamp: "2025-02-14T10:25:30Z",
    type: "text",
  },
];

export const mockAgents: Agent[] = [
  {
    id: "sol-main",
    name: "Sol",
    tier: "sol",
    model: "Opus 4.6",
    emoji: "☀️",
    status: "active",
    currentTask: "Analyzing Kirk Episode 12 transcript",
    sessionCount: 847,
    totalTokens: 12_450_000,
  },
  {
    id: "haiku-worker",
    name: "Haiku Worker",
    tier: "haiku",
    model: "Haiku 4.5",
    emoji: "⚙️",
    status: "active",
    currentTask: "Downloading transcript batch (3/7)",
    sessionCount: 2341,
    totalTokens: 5_230_000,
  },
  {
    id: "sonnet-analyst",
    name: "Sonnet Analyst",
    tier: "sonnet",
    model: "Sonnet 4.5",
    emoji: "🔍",
    status: "active",
    currentTask: "Extracting claims from Episode 12",
    sessionCount: 1256,
    totalTokens: 8_760_000,
  },
  {
    id: "opus-oracle",
    name: "Opus Oracle",
    tier: "opus",
    model: "Opus 4.6",
    emoji: "🧿",
    status: "idle",
    sessionCount: 423,
    totalTokens: 15_890_000,
  },
];

export const mockSessions: AgentSession[] = [
  {
    id: "s1",
    agentId: "sonnet-analyst",
    agentTier: "sonnet",
    agentName: "Sonnet Analyst",
    taskDescription: "Extracting claims from Kirk Episode 12 transcript",
    status: "running",
    startedAt: "2025-02-14T10:24:10Z",
    tokensUsed: 34500,
    cost: 0.12,
  },
  {
    id: "s2",
    agentId: "haiku-worker",
    agentTier: "haiku",
    agentName: "Haiku Worker",
    taskDescription: "Downloading transcript batch (3/7)",
    status: "running",
    startedAt: "2025-02-14T10:20:00Z",
    tokensUsed: 8200,
    cost: 0.01,
  },
  {
    id: "s3",
    agentId: "sonnet-analyst",
    agentTier: "sonnet",
    agentName: "Sonnet Analyst",
    taskDescription: "Cross-referencing Episodes 8-11 timeline claims",
    status: "completed",
    startedAt: "2025-02-14T09:15:00Z",
    completedAt: "2025-02-14T09:32:00Z",
    tokensUsed: 156000,
    cost: 0.78,
  },
  {
    id: "s4",
    agentId: "opus-oracle",
    agentTier: "opus",
    agentName: "Opus Oracle",
    taskDescription: "Deep analysis: Pattern detection across all Kirk episodes",
    status: "completed",
    startedAt: "2025-02-14T08:00:00Z",
    completedAt: "2025-02-14T08:45:00Z",
    tokensUsed: 520000,
    cost: 7.80,
  },
  {
    id: "s5",
    agentId: "haiku-worker",
    agentTier: "haiku",
    agentName: "Haiku Worker",
    taskDescription: "Formatting research notes to markdown",
    status: "completed",
    startedAt: "2025-02-14T07:30:00Z",
    completedAt: "2025-02-14T07:31:00Z",
    tokensUsed: 4200,
    cost: 0.005,
  },
  {
    id: "s6",
    agentId: "sonnet-analyst",
    agentTier: "sonnet",
    agentName: "Sonnet Analyst",
    taskDescription: "Summarizing witness testimonies from Episodes 1-5",
    status: "completed",
    startedAt: "2025-02-13T22:00:00Z",
    completedAt: "2025-02-13T22:18:00Z",
    tokensUsed: 98000,
    cost: 0.49,
  },
];

export const mockDailyUsage: UsageRecord[] = [
  { date: "Feb 8", opus: 4.20, sonnet: 1.80, haiku: 0.30, total: 6.30 },
  { date: "Feb 9", opus: 6.50, sonnet: 2.40, haiku: 0.45, total: 9.35 },
  { date: "Feb 10", opus: 3.10, sonnet: 3.80, haiku: 0.60, total: 7.50 },
  { date: "Feb 11", opus: 8.90, sonnet: 1.20, haiku: 0.25, total: 10.35 },
  { date: "Feb 12", opus: 5.70, sonnet: 4.50, haiku: 0.80, total: 11.00 },
  { date: "Feb 13", opus: 7.80, sonnet: 2.90, haiku: 0.35, total: 11.05 },
  { date: "Feb 14", opus: 7.80, sonnet: 0.90, haiku: 0.02, total: 8.72 },
];

export const mockModelUsage: ModelUsage[] = [
  {
    model: "Opus 4.6",
    tier: "opus",
    inputTokens: 8_450_000,
    outputTokens: 4_230_000,
    cacheRead: 2_100_000,
    cacheWrite: 890_000,
    cost: 44.00,
  },
  {
    model: "Sonnet 4.5",
    tier: "sonnet",
    inputTokens: 5_600_000,
    outputTokens: 2_890_000,
    cacheRead: 1_450_000,
    cacheWrite: 620_000,
    cost: 17.50,
  },
  {
    model: "Haiku 4.5",
    tier: "haiku",
    inputTokens: 3_200_000,
    outputTokens: 1_120_000,
    cacheRead: 980_000,
    cacheWrite: 340_000,
    cost: 2.77,
  },
];
