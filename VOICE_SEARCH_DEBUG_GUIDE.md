# How to Debug iOS Voice Search Issues

This guide will help you collect debug information from your iPhone to help us diagnose voice search issues where the microphone activates but no text is being converted.

## Enabling Debug Mode

When using your iPhone or iPad:

1. Go to the search or watchlist page where you see the microphone icon
2. Look for a small "bug" icon next to the microphone
3. Tap this icon to enable debug mode
4. You'll see a yellow toast notification confirming debug mode is active

## Testing with Debug Mode Enabled

Now try using voice search with debug mode enabled:

1. Tap the microphone icon to start voice search
2. Speak clearly into your device
3. Watch what happens in the app

## Collecting Debug Logs

If voice search doesn't work properly:

1. A debug panel should automatically appear
2. If it doesn't, look for a "Show Debug" button in any error toast
3. The debug panel contains detailed technical logs
4. Tap "Copy All Logs" to copy the logs to your clipboard
5. Paste these logs into an email to our support team

## Key Information to Include

When sending logs, please also include:

1. iPhone/iPad model (e.g., iPhone 13 Pro)
2. iOS version (e.g., iOS 16.5)
3. Browser used (Safari, Chrome, etc.)
4. What you said into the microphone
5. Exactly what happened (mic activated but no text, partial text, wrong text, etc.)

## Common Troubleshooting Steps

Before reporting, try these steps:

1. Make sure your microphone permissions are enabled for Safari
2. Restart your browser completely
3. Try in a quiet environment with minimal background noise
4. Check if you can use voice dictation in other apps (like Messages)
5. Try toggling debug mode off and on again

Your detailed debug logs will help us identify exactly why the Web Speech API is not transcribing your voice on iPhone, which is critical for fixing this issue.
