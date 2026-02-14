import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { mockDailyUsage, mockModelUsage, type AgentTier } from "@/data/mockData";

const tierColors: Record<AgentTier, string> = {
  sol: "hsl(38, 92%, 50%)",
  opus: "hsl(270, 60%, 60%)",
  sonnet: "hsl(210, 80%, 60%)",
  haiku: "hsl(150, 60%, 50%)",
};

const tierBadgeStyles: Record<string, string> = {
  opus: "bg-opus/15 text-opus border-opus/30",
  sonnet: "bg-sonnet/15 text-sonnet border-sonnet/30",
  haiku: "bg-haiku/15 text-haiku border-haiku/30",
};

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

const totalSpend = mockDailyUsage.reduce((s, d) => s + d.total, 0);
const totalTokens = mockModelUsage.reduce((s, m) => s + m.inputTokens + m.outputTokens, 0);
const budgetLimit = 100;

export default function UsagePage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">API Usage & Costs</h2>
        <p className="text-sm text-muted-foreground">Token consumption and spend tracking</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Weekly Spend", value: `$${totalSpend.toFixed(2)}`, icon: DollarSign, accent: "text-sol" },
          { label: "Total Tokens", value: formatTokens(totalTokens), icon: Zap, accent: "text-sonnet" },
          { label: "Active Sessions", value: "2", icon: TrendingUp, accent: "text-haiku" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-2.5 rounded-lg bg-muted ${card.accent}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold font-mono">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Budget */}
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Monthly Budget</span>
            <span className="text-xs font-mono text-muted-foreground">${totalSpend.toFixed(2)} / ${budgetLimit}</span>
          </div>
          <Progress value={(totalSpend / budgetLimit) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Spend Over Time</CardTitle>
            <div className="flex gap-1">
              {(["daily", "weekly", "monthly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockDailyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 20%, 14%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(220, 15%, 55%)" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220, 15%, 55%)" }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(225, 25%, 8%)",
                    border: "1px solid hsl(225, 20%, 14%)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="opus" stackId="1" stroke={tierColors.opus} fill={tierColors.opus} fillOpacity={0.3} />
                <Area type="monotone" dataKey="sonnet" stackId="1" stroke={tierColors.sonnet} fill={tierColors.sonnet} fillOpacity={0.3} />
                <Area type="monotone" dataKey="haiku" stackId="1" stroke={tierColors.haiku} fill={tierColors.haiku} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Model Breakdown */}
      <Card className="border-border overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Model Breakdown</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Model</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Input Tokens</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Output Tokens</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Cache Read</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Cache Write</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Cost</th>
              </tr>
            </thead>
            <tbody>
              {mockModelUsage.map((m) => (
                <tr key={m.model} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={tierBadgeStyles[m.tier] || ""}>
                      {m.model}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">{formatTokens(m.inputTokens)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">{formatTokens(m.outputTokens)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">{formatTokens(m.cacheRead)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">{formatTokens(m.cacheWrite)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">${m.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
