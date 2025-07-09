# iOS Voice Search Debugging Guide

## iPhone Voice Search Troubleshooting

If you're experiencing issues with voice search on your iPhone or iPad (especially where the microphone activates but no text appears), follow these steps:

### 1. Enable Debug Mode

Look for the small bug icon next to the microphone button and tap it to enable debug mode. This will collect detailed logs about what's happening with speech recognition.

### 2. Try Voice Search with Debug Mode

1. Tap the microphone icon to start voice search
2. Speak clearly into your iPhone
3. Note whether the debug panel shows "Speech detected" and "Result received" messages
4. If no text appears, click "Show Debug Panel" in the toast message

### 3. Copy Debug Logs

In the debug panel:
1. Review the logs for any errors or patterns
2. Click the "Copy All Logs" button to copy the logs to your clipboard
3. Paste these logs when reporting the issue

### Common iPhone Issues and Solutions

#### No Speech Detected
- Make sure you're speaking loudly and clearly
- Check that your microphone isn't blocked by a case or your fingers
- Try restarting Safari completely

#### Permission Issues
- Go to Settings → Safari → Websites → Microphone
- Ensure this website is set to "Allow"
- Go to Settings → Privacy & Security → Microphone
- Ensure Safari is enabled

#### Safari Issues
- Try using Chrome on iOS if available
- Make sure your iOS is updated to the latest version
- Try clearing Safari website data (Settings → Safari → Clear History and Website Data)

### Tips for Best Results

- Hold your phone closer to your mouth when speaking
- Speak in a quiet environment with minimal background noise
- Use simple search terms (e.g., "Star Wars" rather than complex phrases)
- If one attempt fails, try tapping the microphone again for a fresh start

If issues persist after collecting debug logs, please provide the logs to the development team for further investigation.
