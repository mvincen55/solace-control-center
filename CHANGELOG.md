# Changelog

All notable changes to Solace Control Center will be documented in this file.

## [v0.4.0] - 2026-02-14

### Added
- **Voice Mode** — Continuous hands-free conversation (Radio icon)
- **Streaming TTS** — Sentences play as they generate, not after full response
- **Auto-listen** — Automatically starts recording after Sol finishes speaking
- **Visual feedback** — Real-time waveform for recording and speaking states
- **Voice service layer** — Centralized audio recording, transcription, and TTS streaming
- **DEPLOY.md** — Version control protocol and rollback instructions
- **Desktop shortcut** — Quick access from Windows desktop

### Changed
- Updated README.md with voice mode documentation and troubleshooting
- Added detailed voice latency optimization docs (VOICE_MODE.md)
- Improved error handling for voice permissions and API failures

### Fixed
- CORS configuration for OpenClaw Gateway connection
- Audio playback queue management (smooth sentence transitions)
- Mic permission handling on page load

## [v0.3.x] - 2026-02-13

### Added
- Initial voice input (manual mic button)
- Text-to-speech toggle
- OpenAI Whisper transcription
- Basic TTS with OpenAI API

### Changed
- Environment variable configuration (.env setup)
- Authentication with OpenClaw Gateway

## [v0.2.x] - 2026-02-13

### Added
- Chat interface with streaming responses
- Tool call visualization
- Session persistence
- Connection status indicators

## [v0.1.0] - 2026-02-13

### Added
- Initial project scaffold with Lovable
- Dark theme UI design
- OpenClaw Gateway integration
- Basic chat functionality
