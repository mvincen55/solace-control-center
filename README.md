# Solace Control Center

A real-time control center for OpenClaw with voice chat — built with Vite, React, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites

- Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- OpenClaw Gateway running locally
- OpenClaw auth token
- OpenAI API key (for voice features)

### 1. Install Dependencies

```sh
npm install
```

### 2. Configure OpenClaw Gateway

The Control Center connects to your OpenClaw Gateway's chat completions endpoint.

**Enable the endpoint** in your OpenClaw config (`~/.openclaw/openclaw.json` or `%USERPROFILE%\.openclaw\openclaw.json`):

```json
{
  "gateway": {
    "chatCompletions": {
      "enabled": true
    }
  }
}
```

**Restart the Gateway** after changing the config:

```sh
openclaw gateway restart
```

### 3. Set Up Environment Variables

Copy the example environment file:

```sh
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
VITE_OPENCLAW_URL=http://127.0.0.1:18789
VITE_OPENCLAW_TOKEN=your_openclaw_token_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

**Where to find your tokens:**

- **OpenClaw token:** Located in your OpenClaw config: `gateway.auth.token` in `openclaw.json`
- **OpenAI API key:** Get from [OpenAI Platform](https://platform.openai.com/api-keys) (required for voice features)
- **Never commit these tokens to version control!** (`.env` is in `.gitignore`)

### 4. Start Development Server

```sh
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

## 🎯 Features

### Phase 1 — Ultra Low Latency Voice Chat (Current)
- ✅ Real-time chat with Sol via OpenClaw Gateway
- ✅ Streaming responses with SSE
- ✅ **Voice mode** - Continuous hands-free conversation
- ✅ **Streaming TTS** - Start speaking while still generating response
- ✅ **Auto-listen** - Automatically start recording after TTS finishes
- ✅ **Visual feedback** - Waveform visualizer for recording and speaking
- ✅ Tool call visualization
- ✅ Session persistence across page reloads
- ✅ Error handling and connection status

### Voice Features

**Voice Mode (Continuous Conversation):**
- Click the **Radio icon** to enable voice mode
- **Automatic loop:** Listen → Transcribe → Send → Stream → TTS → Listen (hands-free!)
- **Streaming TTS:** Sol starts speaking the first sentence while generating the rest (minimal latency)
- **Visual feedback:** Real-time waveform shows recording and speaking states
- **Voice model:** Configurable via `VITE_VOICE_MODEL` env var for faster models

**Manual Voice Input:**
- Click the **Mic button** to record, click again to stop and send
- Audio automatically transcribed via OpenAI Whisper
- Transcription sent as text message

**Voice Output:**
- **Streaming playback:** Sentences play as they're generated, not after full response
- **Auto-TTS toggle:** Enable/disable auto-play with speaker icon
- **Queue-based:** Smooth sentence-by-sentence playback with minimal gaps
- Uses OpenAI TTS (voice: "onyx")

### Phase 2 — Coming Soon
- 🔄 Agents page with real agent status
- 🔄 Usage metrics from OpenClaw
- 🔄 WebSocket support for real-time updates
- 🔄 Agent orchestration controls

## 🛠️ Tech Stack

- **Frontend:** Vite + React + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** OpenClaw Gateway (OpenAI-compatible API)
- **Real-time:** Server-Sent Events (SSE)
- **Voice:** OpenAI Whisper (STT) + TTS API
- **Audio:** Web Audio API + MediaRecorder

## 📁 Project Structure

```
src/
├── components/        # UI components
│   ├── layout/       # App layout components
│   └── ui/           # shadcn/ui components
├── pages/            # Page components
│   └── ChatPage.tsx  # Main chat interface with voice mode
├── services/         # API services
│   ├── openclawApi.ts  # OpenClaw Gateway + OpenAI APIs
│   └── voiceService.ts # Recording, streaming TTS, visualizers
├── data/             # Mock data (legacy)
└── lib/              # Utilities
```

## 🎙️ Voice Mode Usage

### Quick Start
1. **Click the Radio icon** (bottom left) to enable voice mode
2. **Start speaking** when prompted
3. Sol will respond with voice and automatically start listening again
4. **Click Radio again** to disable voice mode and return to text chat

### How It Works
- **Listen:** Mic captures your speech (visual waveform shows recording)
- **Transcribe:** Whisper converts speech to text (auto-sent to Sol)
- **Generate:** Sol responds via OpenClaw Gateway
- **Speak:** TTS plays sentences as they're generated (streaming, not batched)
- **Loop:** Automatically starts listening again after speaking completes

### Latency Optimizations

**1. Streaming TTS (Sentence-by-Sentence)**
- Sol starts speaking the first sentence while still generating the rest
- No waiting for full response before playback begins
- Typical latency: ~500ms from first sentence complete to audio start

**2. Voice Model Selection**
- Set `VITE_VOICE_MODEL` in `.env` to use a faster model for voice conversations
- Example: `VITE_VOICE_MODEL=openclaw:haiku` (faster, lower cost)
- Default: `openclaw:main` (highest quality)

**3. Sentence Buffering**
- Smart boundary detection (`.` `!` `?`) for natural speech flow
- Minimum 10 characters per sentence to avoid fragments
- Queue-based playback with minimal gaps between sentences

**4. Auto-Listen**
- Starts recording automatically after TTS completes (no button press)
- 500ms delay before next recording to avoid false triggers
- Disable by toggling voice mode off

### Tips for Best Experience
- **Speak clearly** and wait for the beep/visual indicator before speaking
- **Short turns** work better than long monologues (easier interruption)
- **Quiet environment** reduces transcription errors
- **Wired mic** often has lower latency than Bluetooth

## 🐛 Troubleshooting

### "Cannot connect to OpenClaw Gateway"

1. Check if the Gateway is running: `openclaw gateway status`
2. Start it if needed: `openclaw gateway start`
3. Verify the URL in `.env` matches your Gateway config

### "Authentication failed"

1. Check your OpenClaw token in `.env` matches `gateway.auth.token` in `openclaw.json`
2. Check your OpenAI API key is valid at [OpenAI Platform](https://platform.openai.com/api-keys)
3. Make sure there are no extra spaces or quotes in the `.env` file

### "Chat completions endpoint not found"

1. Enable the endpoint in your OpenClaw config (see step 2 above)
2. Restart the Gateway: `openclaw gateway restart`

### Voice Mode Issues

**Voice mode stops automatically:**
- Check browser console for errors
- Microphone permission may have been revoked mid-session
- Audio playback might have failed (check OpenAI API credits)
- Refresh page and enable voice mode again

**Microphone access denied:**
- Browser will prompt for microphone permission on first use
- Check browser settings → Site permissions → Microphone
- HTTPS required for production (works on localhost without)
- Some browsers (Safari) require manual permission reset

**"Missing OpenAI API key":**
- Add `VITE_OPENAI_API_KEY` to your `.env` file
- Get a key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Restart dev server after adding the key

**Audio won't auto-play:**
- Some browsers block auto-play until user interaction
- Click anywhere on the page first, then try voice mode
- This is a browser security feature, not a bug

**TTS playback is choppy/laggy:**
- Check your internet connection (OpenAI TTS requires bandwidth)
- Try a faster voice model: `VITE_VOICE_MODEL=openclaw:haiku`
- Reduce concurrent browser tabs/applications
- Wired ethernet connection recommended for best results

**Transcription is inaccurate:**
- Speak clearly and at a moderate pace
- Reduce background noise
- Use a quality microphone (built-in laptop mics are often poor)
- Check that the correct microphone is selected in browser settings

### Connection Refused

- Make sure OpenClaw Gateway is running on `http://127.0.0.1:18789`
- Check firewall settings aren't blocking local connections

## 🔐 Security Notes

- **Never commit `.env`** — it contains your auth tokens
- The OpenClaw token grants full access to your OpenClaw instance
- The OpenAI key grants access to your OpenAI account and will incur costs
- Only run the Control Center on your local machine (not exposed to the internet)

## 💰 API Costs

Voice features use OpenAI's paid APIs:
- **Whisper (STT):** $0.006 per minute of audio
- **TTS:** $0.015 per 1K characters (tts-1 model)

These costs are typically very low for personal use. Monitor your usage at [OpenAI Usage](https://platform.openai.com/usage).

## 📦 Build for Production

```sh
npm run build
```

The built files will be in the `dist/` directory.

## 🎨 Design

The Solace Control Center uses a dark theme with:
- **Primary Color:** Sol orange (`#F97316`)
- **Background:** Deep dark (`#0A0A0A`)
- **Cards:** Subtle dark (`#171717`)

Visual design is final — do not modify colors or layout.

## 🤝 Development

**Built with Lovable:** This project was scaffolded with [Lovable](https://lovable.dev).

To make changes:
- Edit files locally and push, or
- Use the Lovable interface at your project URL

## 📄 License

Private project for Solace Intelligence.
