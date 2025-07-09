# Voice Search Feature Documentation

## Overview
Voice search has been added to both the Search and Watchlist pages, allowing users to search for content using their voice instead of typing.

## Features

### 🎤 **Voice Recognition**
- Uses the Web Speech API for browser-native voice recognition
- Supports continuous listening with real-time feedback
- Automatic transcription of speech to text

### 🌐 **Browser Support**
- **Supported**: Chrome, Edge, Safari (latest versions)
- **Not Supported**: Firefox (does not support Web Speech API)
- Graceful degradation: Voice button only appears if supported

### 🔧 **Functionality**

#### **Search Page**
- Located below the search input field (only visible in "Title Search" mode)
- Voice input automatically triggers search
- Results appear immediately after speaking

#### **Watchlist Page**
- Located next to the watchlist search input
- Voice input filters the existing watchlist
- Works with all existing filters (status, media type, etc.)

### 🎯 **User Experience**

#### **Visual Feedback**
- **Inactive**: Gray microphone button with "Voice" label
- **Listening**: Red pulsing button with "Stop" label
- **Transcription**: Real-time display of spoken text
- **Toast Notifications**: Success/error feedback

#### **Error Handling**
- Network errors
- Microphone permission denied
- No speech detected
- Audio capture issues
- Browser compatibility

### 🔒 **Privacy & Permissions**
- Requires microphone permission (browser will prompt)
- Speech processing is done locally by the browser
- No voice data is sent to external servers
- Users can grant/deny permission as needed

### 💡 **Usage Tips**
1. **Click the microphone button** to start listening
2. **Speak clearly** for best recognition
3. **Wait for the red pulse** to indicate listening state
4. **Click "Stop"** to manually stop listening (or just stop speaking)
5. **Allow microphone access** when prompted

### 🎨 **Design Integration**
- Consistent with existing UI components
- Responsive design (works on mobile and desktop)
- Accessible with proper ARIA labels
- Matches the app's dark theme

### 🔧 **Technical Implementation**
- **Component**: `/components/VoiceSearch.tsx`
- **Dependencies**: Web Speech API, React hooks
- **Error Handling**: Comprehensive error states
- **Performance**: Lightweight with proper cleanup
- **TypeScript**: Fully typed with proper interfaces

## Example Voice Commands
- "Stranger Things" → Searches for Stranger Things
- "Marvel movies" → Searches for Marvel content
- "Breaking Bad" → Searches for Breaking Bad
- "Star Wars" → Searches for Star Wars franchise

The voice search feature enhances accessibility and provides a modern, hands-free way to interact with the Movie Watchlist App!
