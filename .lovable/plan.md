
# Solace Control ☀️ — Implementation Plan

## Overview
A dark-themed command center dashboard for managing Sol, an AI agent running on OpenClaw. The first build focuses on **Live Chat, Agents, and API Usage** pages with realistic mock data, establishing the full layout and design system. Remaining pages follow as a second phase.

---

## Phase 1: Foundation & Layout

### App Shell
- Dark theme by default with mission-control aesthetic — dark backgrounds, subtle borders, glowing accents
- **Header bar**: "Solace Control ☀️" branding with Sol's live status indicator (online/offline/thinking) — mock as "online" initially
- **Left sidebar** with navigation icons and labels for all 8 sections (Chat, Activity, API Usage, Projects, Memory, Files, Agents, Settings) — non-priority pages show "Coming Soon" placeholders
- Mobile-responsive: sidebar collapses to icon-only on small screens, hamburger menu on phone

### Design System
- Agent tier color coding: **Opus = deep purple**, **Sonnet = blue**, **Haiku = green**
- Monospace accents for technical data (tokens, timestamps, costs)
- Subtle entry animations for real-time feel (fade-in, slide-up on new items)

---

## Phase 2: Live Chat Page

- Full-height chat interface with message bubbles — user messages on right, Sol's on left
- Each message shows **timestamp** and sender
- **Thinking indicator**: animated dots/pulse when Sol is "processing"
- **Tool call cards**: collapsible inline cards within the conversation showing tool name (web search, file read, exec), parameters, and result — styled distinctly from regular messages
- **Voice note indicator**: small audio badge when Sol sends an audio response
- Text input bar at bottom with send button
- All powered by **mock conversation data** demonstrating various message types (text, tool calls, thinking states, voice)

---

## Phase 3: Agents Page

- Card grid showing all 4 agents: **Sol (main)**, **Haiku Worker ⚙️**, **Sonnet Analyst 🔍**, **Opus Oracle 🧿**
- Each card displays: model name, tier-colored badge, status (active/idle), current task if active, session count, total tokens used
- **Active sub-agent sessions** section: live-feeling list of running tasks with descriptions and progress indicators
- **Completed tasks history**: scrollable table of past sub-agent tasks with results, tokens used, and cost
- Mock data showing a realistic mix of active and completed agent work

---

## Phase 4: API Usage & Costs Page

- **Summary cards** at top: total spend (day/week/month), total tokens, active sessions
- **Recharts line/area charts**: spend over time with toggleable daily/weekly/monthly views
- **Model breakdown table**: rows for Opus 4.6, Sonnet 4.5, Haiku 4.5 — showing input tokens, output tokens, cache reads/writes, cost
- **Per-session cost list**: recent sessions with their individual costs
- **Budget indicator**: progress bar toward a configurable budget limit with alert threshold
- All using realistic mock usage data

---

## Phase 5: Placeholder Pages

- **Activity Feed, Projects & Research, Memory & Identity, File Browser, Settings** — each gets a styled placeholder page with a brief description of what's coming, maintaining the app's polished feel
- Settings page will include basic connection config fields (OpenClaw URL, auth token) as non-functional UI previews

---

## Future Phases (not in this build)
- Supabase integration: tables for api_usage, projects, research_items, memory_snapshots, agent_sessions
- Real WebSocket connection to OpenClaw gateway
- Supabase realtime subscriptions for cross-device updates
- Activity Feed, Projects, Memory, File Browser, and Settings pages fully built out
