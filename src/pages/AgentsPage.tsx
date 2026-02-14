import { motion } from "framer-motion";
import { Clock, Zap, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockAgents, mockSessions, type AgentTier } from "@/data/mockData";

const tierStyles: Record<AgentTier, string> = {
  sol: "bg-sol/15 text-sol border-sol/30",
  opus: "bg-opus/15 text-opus border-opus/30",
  sonnet: "bg-sonnet/15 text-sonnet border-sonnet/30",
  haiku: "bg-haiku/15 text-haiku border-haiku/30",
};

const tierGlow: Record<AgentTier, string> = {
  sol: "glow-sol",
  opus: "glow-opus",
  sonnet: "glow-sonnet",
  haiku: "glow-haiku",
};

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AgentsPage() {
  const activeSessions = mockSessions.filter((s) => s.status === "running");
  const completedSessions = mockSessions.filter((s) => s.status !== "running");

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Agents</h2>
        <p className="text-sm text-muted-foreground">Active agents and sub-agent sessions</p>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockAgents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`${tierGlow[agent.tier]} border-border`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-lg">{agent.emoji}</span>
                    {agent.name}
                  </CardTitle>
                  <Badge variant="outline" className={tierStyles[agent.tier]}>
                    {agent.status}
                  </Badge>
                </div>
                <p className="text-xs font-mono text-muted-foreground">{agent.model}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {agent.currentTask && (
                  <div className="text-xs text-foreground/80 bg-accent/50 rounded px-2.5 py-1.5">
                    {agent.currentTask}
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {agent.sessionCount} sessions
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {formatTokens(agent.totalTokens)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
            Active Sessions
          </h3>
          <div className="space-y-2">
            {activeSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="border-border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Badge variant="outline" className={`${tierStyles[session.agentTier]} shrink-0`}>
                      {session.agentName}
                    </Badge>
                    <p className="text-sm flex-1">{session.taskDescription}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <span className="font-mono">{formatTokens(session.tokensUsed)} tok</span>
                      <span className="font-mono">${session.cost.toFixed(2)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(session.startedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Completed Tasks</h3>
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Agent</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Task</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Tokens</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Cost</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Duration</th>
                </tr>
              </thead>
              <tbody>
                {completedSessions.map((session) => {
                  const duration = session.completedAt
                    ? Math.round(
                        (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
                      )
                    : null;
                  return (
                    <tr key={session.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className={tierStyles[session.agentTier]}>
                          {session.agentName}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-foreground/80">{session.taskDescription}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">{formatTokens(session.tokensUsed)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">${session.cost.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                        {duration !== null ? `${duration}m` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
