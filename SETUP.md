# Solace Control Center — Quick Setup Guide

## 🚦 Step-by-Step Setup

### 1. Check OpenClaw Gateway Status

```sh
openclaw gateway status
```

If not running:
```sh
openclaw gateway start
```

### 2. Enable Chat Completions Endpoint

Edit your OpenClaw config (`~/.openclaw/openclaw.json` on Mac/Linux or `%USERPROFILE%\.openclaw\openclaw.json` on Windows):

```json
{
  "gateway": {
    "chatCompletions": {
      "enabled": true
    },
    "auth": {
      "token": "your-openclaw-token-will-be-here"
    }
  }
}
```

**Important:** Copy the `token` value — you'll need it in step 4.

### 3. Get OpenAI API Key

Voice features require an OpenAI API key:

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in (or create an account)
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. Save it somewhere safe — you'll need it in step 4

**Note:** Voice features use paid APIs (Whisper STT + TTS). Costs are typically very low (~$0.02-0.05 per conversation).

### 4. Restart Gateway

```sh
openclaw gateway restart
```

### 5. Configure Control Center

In the `solace-control-center` directory:

```sh
# Copy environment template
cp .env.example .env

# Edit .env and add your tokens
# (use your favorite editor: nano, vim, code, notepad, etc.)
```

Your `.env` should look like:
```env
VITE_OPENCLAW_URL=http://127.0.0.1:18789
VITE_OPENCLAW_TOKEN=paste_your_openclaw_token_here
VITE_OPENAI_API_KEY=paste_your_openai_api_key_here
```

### 6. Install & Run

```sh
# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:5173` and start chatting with Sol! ☀️

## ✅ Verification Checklist

- [ ] OpenClaw Gateway is running (`openclaw gateway status`)
- [ ] Chat completions endpoint is enabled in config
- [ ] Gateway was restarted after config change
- [ ] `.env` file exists with correct OpenClaw token
- [ ] `.env` file has valid OpenAI API key
- [ ] `npm install` completed successfully
- [ ] Dev server is running (`npm run dev`)
- [ ] Browser shows Control Center at `http://localhost:5173`
- [ ] Browser has microphone permission (for voice input)

## 🎤 Testing Voice Features

### Voice Input (Whisper STT)

1. Click and hold the microphone button (left of input box)
2. Speak your message
3. Release the button
4. Wait for transcription (~1-2 seconds)
5. Message sends automatically

**Troubleshooting:**
- Browser will ask for microphone permission — click "Allow"
- If transcription fails, check your OpenAI API key
- Check browser console for error messages

### Voice Output (TTS)

1. Send a text message or use voice input
2. Sol's response will auto-play (if auto-TTS is on)
3. Toggle auto-TTS with the button (top right)
4. Use playback controls in voice bubbles

**Troubleshooting:**
- If audio doesn't auto-play, browser may block it — click play button
- Toggle auto-TTS off if you prefer text-only responses
- Check OpenAI API key if TTS fails

## 🐛 Common Issues

### "Missing authentication token"
- Make sure `.env` exists and has both tokens
- Check there are no extra spaces or quotes
- Restart the dev server after editing `.env`

### "Cannot connect to OpenClaw Gateway"
- Verify Gateway is running: `openclaw gateway status`
- Check the URL in `.env` matches your Gateway config
- Try accessing `http://127.0.0.1:18789/v1/models` in a browser

### "Chat completions endpoint not found"
- Verify `gateway.chatCompletions.enabled: true` in OpenClaw config
- Restart the Gateway after changing config
- Check Gateway logs for any errors

### "Microphone Access Denied"
- Browser needs permission to access microphone
- Go to browser settings → Site permissions → Microphone
- Refresh the page after granting permission

### "Transcription Failed" or "TTS Failed"
- Check `VITE_OPENAI_API_KEY` is set correctly in `.env`
- Verify API key is valid at [OpenAI Platform](https://platform.openai.com/api-keys)
- Check you have credits/billing set up on OpenAI account
- Restart dev server after adding/changing the key

### Audio Won't Auto-Play
- Modern browsers block auto-play until user interacts with page
- Click anywhere on the page first, then send a message
- Or manually click the play button on voice bubbles
- This is a browser security feature, not a bug

### Changes to .env not taking effect
- Restart the Vite dev server (`Ctrl+C` then `npm run dev`)
- Clear browser cache and reload

## 🔒 Security Reminder

**Never commit `.env` to version control!**

The `.env` file contains:
- Your OpenClaw auth token (full access to your instance)
- Your OpenAI API key (access to your OpenAI account)

Both are sensitive and should never be shared or committed. The file is already in `.gitignore`, but double-check before pushing code.

## 🎯 What's Working (Phase 1)

✅ Real-time chat with Sol
✅ Streaming responses
✅ Tool call visualization
✅ Session persistence
✅ **Voice input** (Whisper transcription)
✅ **Voice output** (OpenAI TTS)
✅ Audio playback controls
✅ Auto-TTS toggle
✅ Error handling

## 💰 API Costs

Voice features use OpenAI's paid APIs:

| Feature | Cost | Example |
|---------|------|---------|
| Whisper (STT) | $0.006/min | 10 min audio = $0.06 |
| TTS | $0.015/1K chars | 1K char response = $0.015 |

**Typical conversation:** ~$0.02-0.05 total

Monitor usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage).

## 🚀 Coming Next (Phase 2)

- Real agent status and metrics
- WebSocket integration
- Agent orchestration controls
- Usage analytics

---

**Need help?** Check the main [README.md](./README.md) for full documentation.
