# Voice Features — Technical Documentation

## Overview

The Solace Control Center includes full voice chat capabilities:
- **Voice Input:** Whisper-based speech-to-text transcription
- **Voice Output:** OpenAI TTS for Sol's responses
- **Audio Playback:** In-line audio player with controls

## Architecture

### Voice Input Flow

```
User holds mic button
  ↓
MediaRecorder captures audio (webm/opus)
  ↓
Audio sent to OpenAI Whisper API
  ↓
Transcription returned as text
  ↓
Text auto-filled in input and sent to Sol
```

### Voice Output Flow

```
Sol sends text response
  ↓
Auto-TTS enabled? (check toggle)
  ↓
Text sent to OpenAI TTS API
  ↓
Audio blob returned
  ↓
Voice bubble created with audio URL
  ↓
Audio auto-plays (if browser allows)
```

## Implementation Details

### Audio Recording (`src/pages/ChatPage.tsx`)

**MediaRecorder Setup:**
```typescript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: "audio/webm;codecs=opus",
});
```

**Recording Trigger:**
- Mouse: `onMouseDown` starts, `onMouseUp` stops
- Touch: `onTouchStart` starts, `onTouchEnd` stops
- Hold-to-record pattern (no toggle mode)

**Browser Compatibility:**
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: webm support limited (falls back to MP4)

### Whisper Transcription (`src/services/openclawApi.ts`)

**API Call:**
```typescript
POST https://api.openai.com/v1/audio/transcriptions
Content-Type: multipart/form-data
Authorization: Bearer <OPENAI_API_KEY>

{
  file: <audio.webm>,
  model: "whisper-1"
}
```

**Response:**
```json
{
  "text": "transcribed text here"
}
```

**Error Handling:**
- 401/403: Invalid API key
- Network errors: Connection issues
- Empty response: No speech detected

### TTS Generation (`src/services/openclawApi.ts`)

**API Call:**
```typescript
POST https://api.openai.com/v1/audio/speech
Content-Type: application/json
Authorization: Bearer <OPENAI_API_KEY>

{
  model: "tts-1",
  voice: "onyx",
  input: "text to speak"
}
```

**Response:**
- Binary audio blob (MP3 format)
- Typically 20-50KB per sentence

**Voice Selection:**
- Current: `"onyx"` (deep, authoritative)
- Alternatives: `"alloy"`, `"echo"`, `"fable"`, `"nova"`, `"shimmer"`
- Voice can be changed in `textToSpeech()` function

### Audio Playback

**Voice Bubble Component:**
- Shows waveform visualization
- Play/pause button
- Auto-plays on creation (if allowed)
- Audio element managed via `useRef`

**Auto-Play Handling:**
```typescript
audio.play().catch((err) => {
  // Browser blocked auto-play
  toast({ title: "Audio Ready", description: "Click play to listen" });
});
```

**Cleanup:**
- Audio URLs created with `URL.createObjectURL()`
- Should be revoked when component unmounts (TODO: add cleanup)

## State Management

### Recording State
```typescript
const [isRecording, setIsRecording] = useState(false);
const [isTranscribing, setIsTranscribing] = useState(false);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const audioChunksRef = useRef<Blob[]>([]);
```

### Audio Playback State
```typescript
const [isPlaying, setIsPlaying] = useState(false);
const audioRef = useRef<HTMLAudioElement>(null);
```

### Auto-TTS Toggle
```typescript
const [autoTTS, setAutoTTS] = useState(true);
// Saved in component state (TODO: persist to localStorage)
```

## UI Components

### Mic Button
- **Location:** Left of input box
- **States:**
  - Default: Gray mic icon
  - Recording: Red pulsing mic-off icon
  - Disabled: During transcription or streaming
- **Behavior:** Hold to record (not toggle)

### Auto-TTS Toggle
- **Location:** Top right of chat area
- **States:**
  - On: Volume2 icon + "Auto-TTS On"
  - Off: VolumeX icon + "Auto-TTS Off"
- **Persists:** During session only (not across reloads)

### Voice Bubble
- **Appearance:** Waveform visualization with controls
- **Controls:** Play/pause button
- **Timestamp:** Shows when audio was created
- **Visual Feedback:** Waveform animates when playing

### Status Indicators
- **Recording:** Red pulsing dot + "Recording..." text
- **Transcribing:** Spinner + "Transcribing..." text
- **Location:** Top bar above chat messages

## Error Handling

### Microphone Permission
```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
} catch (error) {
  toast({
    title: "Microphone Access Denied",
    description: "Please allow microphone access to use voice input.",
    variant: "destructive",
  });
}
```

### API Errors
- **Missing API Key:** User-friendly error toast
- **Invalid API Key:** Auth error with instructions
- **Network Failure:** Connection error with retry suggestion
- **Rate Limiting:** Should handle gracefully (not implemented yet)

### Silent Failures
- TTS errors are logged but don't show error toast (non-critical)
- User can still read text response if TTS fails
- Failed audio URLs won't break the UI

## Configuration

### Environment Variables
```env
# Required for voice features
VITE_OPENAI_API_KEY=sk-...

# Optional (has defaults)
VITE_OPENCLAW_URL=http://127.0.0.1:18789
```

### Customization Options

**Change TTS Voice:**
Edit `src/services/openclawApi.ts`:
```typescript
body: JSON.stringify({
  model: "tts-1",
  voice: "nova", // Change to: alloy, echo, fable, nova, onyx, shimmer
  input: text,
}),
```

**Change Recording Format:**
Edit `src/pages/ChatPage.tsx`:
```typescript
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: "audio/webm;codecs=opus", // or "audio/mp4" for Safari
});
```

**Auto-Send After Transcription:**
Currently enabled. To disable, remove:
```typescript
setTimeout(() => handleSend(transcription), 100);
```

## API Costs

### Whisper (Speech-to-Text)
- **Pricing:** $0.006 per minute
- **Billing:** Rounded to nearest second
- **Example:** 30-second message = $0.003

### TTS (Text-to-Speech)
- **Pricing:** $0.015 per 1,000 characters
- **Model:** tts-1 (faster, cheaper)
- **Alternative:** tts-1-hd (higher quality, 2x cost)
- **Example:** 200-character response = $0.003

### Typical Usage
- **Average conversation:** 10 messages, mixed voice/text
- **Cost estimate:** $0.02 - $0.05 per conversation
- **Monthly (active use):** ~$5-20 depending on usage

## Performance Considerations

### Audio Recording
- **Bitrate:** Default (typically 128kbps for opus)
- **Format:** WebM with Opus codec (good compression)
- **File Size:** ~15KB per second of audio

### Latency
- **Recording:** Instant start
- **Whisper API:** 1-3 seconds (depends on audio length)
- **TTS API:** 0.5-2 seconds (depends on text length)
- **Total round-trip:** 2-5 seconds for voice input → response

### Optimizations
- Audio chunks streamed (not buffered entirely)
- TTS generated in parallel with response streaming
- No unnecessary re-renders during playback

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| MediaRecorder | ✅ | ✅ | ⚠️ | ✅ |
| webm/opus | ✅ | ✅ | ❌ | ✅ |
| Auto-play | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

**Notes:**
- Safari requires MP4 format (not webm) — needs fallback
- Auto-play blocked until user interaction (all browsers)
- Microphone requires HTTPS in production (localhost OK)

## Future Improvements

### Priority
- [ ] Persist auto-TTS preference to localStorage
- [ ] Add waveform visualization during recording
- [ ] Show transcription confidence score
- [ ] Add audio recording duration limit

### Nice-to-Have
- [ ] Voice activity detection (auto-stop recording)
- [ ] Multiple TTS voice options in UI
- [ ] Adjust playback speed control
- [ ] Download audio button
- [ ] Keyboard shortcut for voice input (Space bar?)
- [ ] Visual feedback during TTS generation

### Optimizations
- [ ] Cache TTS responses for repeated phrases
- [ ] Compress audio before sending to Whisper
- [ ] Batch multiple short recordings
- [ ] Use tts-1-hd for longer responses only

## Debugging

### Enable Verbose Logging
```typescript
// In openclawApi.ts
console.log("Sending audio blob:", audioBlob.size, "bytes");
console.log("Whisper response:", result);
console.log("TTS request:", text.length, "chars");
```

### Check Browser Console
- Network tab: See API requests/responses
- Console: Check for permission errors
- Application tab: Verify environment variables

### Test API Keys Separately
```sh
# Test OpenAI API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $VITE_OPENAI_API_KEY"
```

### Common Debug Scenarios
1. **No audio recorded:** Check MediaRecorder state
2. **Transcription empty:** Verify audio format/quality
3. **TTS silent:** Check audio URL and blob size
4. **Auto-play blocked:** Expected behavior, click play button

---

**Last Updated:** 2026-02-13  
**Maintainer:** Builder (Solace Intelligence Tech Lead)
