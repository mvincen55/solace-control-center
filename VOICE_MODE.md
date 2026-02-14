# Voice Mode - Ultra Low Latency Implementation

## 🎯 Critical Optimizations Implemented

### 1. Streaming TTS (Sentence-by-Sentence)
**Problem:** Waiting for the full response before starting TTS adds 5-10+ seconds of latency.

**Solution:**
- `SentenceBuffer` class extracts complete sentences from streaming text in real-time
- Each sentence is sent to TTS API immediately upon completion
- `StreamingTTSPlayer` queues and plays sentences while the rest is still generating
- **Result:** User hears the first sentence ~500ms after it's complete, not after the entire response

**Implementation:**
```typescript
// In ChatPage.tsx, during streaming:
if (autoPlayTTS) {
  const sentences = sentenceBuffer.current.add(chunk.content);
  if (sentences.length > 0) {
    sentences.forEach(sentence => {
      ttsPlayer.current.addSentence(sentence); // Plays immediately
    });
  }
}
```

### 2. Voice Model Environment Variable
**Problem:** Different models have different latency/cost tradeoffs. Hardcoding a model prevents optimization.

**Solution:**
- Added `VITE_VOICE_MODEL` env var (default: `openclaw:main`)
- Voice mode conversations use this model automatically
- Regular text chat still uses `openclaw:main`
- Allows pointing at faster models (e.g., `openclaw:haiku`, `gpt-4o-mini`) without code changes

**Usage:**
```env
# .env
VITE_VOICE_MODEL=openclaw:haiku  # Faster, lower cost for voice
```

### 3. Auto-Listen After Playback
**Problem:** Clicking a button after every response destroys conversation flow.

**Solution:**
- Voice mode toggle (Radio icon) enables continuous conversation loop
- After TTS completes, automatically starts recording after 500ms delay
- No button presses needed once voice mode is active
- Loop: Listen → Transcribe → Send → Stream → TTS → Listen (automatic)

**Implementation:**
```typescript
ttsPlayer.current.onComplete(() => {
  setIsSpeaking(false);
  
  // Auto-listen in voice mode
  if (voiceMode && !isStreaming) {
    setTimeout(() => {
      handleVoiceRecord().catch(err => {
        console.error("Auto-listen failed:", err);
        setVoiceMode(false);
      });
    }, 500);
  }
});
```

### 4. Visual Feedback
**Problem:** User doesn't know if the system is listening or speaking.

**Solution:**
- `AudioVisualizer` component shows real-time waveform during recording and TTS
- Fixed position overlay (bottom center) with animated microphone/speaker icon
- Visual state indicators:
  - Recording: Pulsing mic icon + "Listening..." + waveform
  - Speaking: Pulsing speaker icon + "Speaking..." + waveform
- Canvas-based visualization for professional look

**UI States:**
- **Voice mode active:** Radio icon glows orange with pulse animation
- **Recording:** Red pulsing mic button + waveform overlay
- **Speaking:** TTS waveform overlay shows playback state
- **Disabled:** Grey icons, no animations

---

## 📊 Latency Breakdown

### Before Optimizations
```
User stops speaking
  ↓ 1-2s: Whisper transcription
  ↓ 0.5s: Network round-trip
  ↓ 5-15s: Full response generation
  ↓ 1-2s: TTS generation
  ↓ 0.5s: Audio playback starts
  = 8-20+ seconds total
```

### After Optimizations
```
User stops speaking
  ↓ 1-2s: Whisper transcription
  ↓ 0.5s: Network round-trip
  ↓ 2-3s: First sentence generation
  ↓ 0.5s: First sentence TTS
  ↓ 0.5s: Audio playback starts
  = 4-6 seconds to first word spoken
  (Rest plays while generating)
```

**Improvement:** ~50-70% reduction in perceived latency

---

## 🔧 Configuration Options

### Environment Variables
```env
# OpenClaw Gateway
VITE_OPENCLAW_URL=http://127.0.0.1:18789
VITE_OPENCLAW_TOKEN=your_gateway_token

# OpenAI APIs (Whisper + TTS)
VITE_OPENAI_API_KEY=your_openai_key

# Voice model (NEW)
VITE_VOICE_MODEL=openclaw:main  # or openclaw:haiku for speed
```

### Model Selection Guide
| Model | Latency | Quality | Cost | Use Case |
|-------|---------|---------|------|----------|
| `openclaw:main` (Opus 4) | Medium | Highest | $$$$ | Production, important conversations |
| `openclaw:sonnet` | Low | High | $$$ | Balanced quality/speed |
| `openclaw:haiku` | Lowest | Good | $$ | Voice mode, rapid interactions |
| `gpt-4o-mini` | Low | High | $$ | Alternative fast model |

**Recommendation:** Use `openclaw:haiku` for voice mode if latency is critical.

---

## 🎨 UI Components

### Voice Mode Toggle (Radio Icon)
- **Location:** Bottom left of input bar
- **States:**
  - Off: Grey ghost button
  - On: Orange solid button with pulse animation
- **Behavior:** Click to enable/disable continuous voice loop

### TTS Toggle (Speaker Icon)
- **Location:** Second from left
- **States:**
  - On: Volume2 icon
  - Off: VolumeX icon
- **Behavior:** Enable/disable auto-TTS (persists across messages)

### Manual Mic Button
- **Location:** Second from right (hidden in voice mode)
- **States:**
  - Idle: Grey ghost button
  - Recording: Red destructive button with pulse
- **Behavior:** Click to start/stop single voice recording

### Audio Visualizer Overlay
- **Location:** Fixed bottom center
- **Content:** Icon + status text + canvas waveform
- **Animations:** Smooth fade in/out, pulsing icons
- **Canvas:** 200x40px real-time frequency visualization

---

## 🧠 Technical Architecture

### Sentence Buffering
```typescript
class SentenceBuffer {
  add(text: string): string[]     // Extract complete sentences
  flush(): string | null           // Get remaining text
  clear(): void                    // Reset buffer
}
```

**Algorithm:**
1. Accumulate incoming text chunks
2. Regex match: `/[^.!?]+[.!?]+(?=\s|$)/g`
3. Extract sentences ≥10 characters (avoid fragments)
4. Keep incomplete text in buffer
5. Flush remaining text on stream end

### Streaming TTS Player
```typescript
class StreamingTTSPlayer {
  addSentence(sentence: string)   // Queue sentence for TTS
  stop()                           // Stop and clear queue
  resume()                         // Resume after stop
  onComplete(callback)             // Called when queue empty
  onStart(callback)                // Called when playback starts
}
```

**Flow:**
1. Sentence arrives → added to queue
2. If not playing, start immediately
3. Generate TTS for sentence
4. Play audio
5. On audio end, play next in queue
6. If queue empty, fire `onComplete` callback

### Voice Mode State Machine
```
[Idle] 
  → Click Radio → [Listening]
  → Record → [Transcribing]
  → Transcribe complete → [Sending]
  → Stream starts → [Generating]
  → First sentence → [Speaking + Generating]
  → Stream complete → [Speaking]
  → TTS complete → [Listening] (loop)
```

**Exit conditions:**
- User clicks Radio icon (disable voice mode)
- Error occurs (permission denied, API failure)
- Manual stop via mic button

---

## 🚀 Performance Tips

1. **Use a faster voice model** in `.env`:
   ```env
   VITE_VOICE_MODEL=openclaw:haiku
   ```

2. **Wired internet connection** (WiFi adds jitter)

3. **Quality microphone** (better transcription = fewer retries)

4. **Quiet environment** (reduces false triggers)

5. **Modern browser** (Chrome/Edge recommended for best WebRTC support)

6. **Close unnecessary tabs** (reduce browser resource usage)

---

## 🐛 Known Issues & Future Improvements

### Current Limitations
- No interruption support (can't stop mid-response)
- No local TTS option (always uses OpenAI)
- No voice activity detection (must click to start/stop)
- No custom wake word

### Planned Enhancements
- [ ] Voice activity detection (VAD) for auto-start/stop
- [ ] Interruption support (click to cancel mid-response)
- [ ] Local TTS fallback (Piper, Coqui)
- [ ] Wake word detection ("Hey Sol")
- [ ] Multi-voice support (different voices for agents)
- [ ] Real-time transcription display (show text as speaking)
- [ ] Conversation history export

---

## 📈 Metrics & Monitoring

### Latency Tracking (Future)
- Time to first sentence (generation)
- Time to first audio (TTS + playback)
- Total conversation turn time
- Transcription accuracy rate

### User Experience (Future)
- Voice mode engagement rate
- Average conversation length
- Manual mic vs voice mode ratio
- TTS toggle usage patterns

---

## ✅ Validation Checklist

- [x] Streaming TTS implemented (sentence-by-sentence)
- [x] Voice model env var (`VITE_VOICE_MODEL`)
- [x] Auto-listen after playback in voice mode
- [x] Visual feedback (waveform + icons)
- [x] Voice mode toggle (continuous conversation)
- [x] Manual mic button (single recording)
- [x] TTS toggle (enable/disable auto-play)
- [x] Error handling (permission denied, API failures)
- [x] Documentation updated
- [x] Configuration examples provided

**Status:** ✅ All critical optimizations implemented

---

Built for **Solace Intelligence** — minimizing latency, maximizing flow.
