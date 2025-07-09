## Voice Search Troubleshooting Guide

### Quick Permission Check
1. **Click the Voice button** 🎤
2. **Watch for browser permission prompt** (usually top of page)
3. **Click "Allow"** when prompted
4. **Try speaking** immediately after allowing

### Browser-Specific Steps

#### Chrome/Edge - Detailed Steps:
1. **URL Bar Method:**
   - Look for 🎤 icon in address bar
   - Click it → Select "Allow"
   - Refresh page

2. **Site Settings Method:**
   - Click 🔒 (lock icon) next to URL
   - Click "Site settings"
   - Find "Microphone" → Change to "Allow"
   - Refresh page

3. **Global Settings Method:**
   - Go to: `chrome://settings/content/microphone`
   - Click "Add" next to "Allow"
   - Enter: `http://localhost:3000`
   - Save and refresh

#### Safari:
1. **Menu Bar:** Safari → Settings → Websites
2. **Left Sidebar:** Click "Microphone"  
3. **Find Site:** Look for localhost:3000
4. **Change Setting:** Select "Allow"
5. **Refresh:** Reload the page

#### Firefox:
- ⚠️ **Note:** Firefox doesn't support Web Speech API
- Voice search will not appear in Firefox
- Use Chrome, Edge, or Safari instead

### Testing Voice Search

#### Test Phrases:
- **"Marvel"** → Should find Marvel movies/shows
- **"Stranger Things"** → Should find the TV series
- **"Star Wars"** → Should find Star Wars content
- **"Breaking Bad"** → Should find the TV series

#### Expected Behavior:
1. **Click Voice button** → Button turns red and pulses
2. **Start speaking** → Real-time transcription appears
3. **Stop speaking** → Button returns to normal
4. **Search triggers** → Results populate automatically

#### Success Indicators:
- ✅ **Toast:** "Listening... Speak now to search"
- ✅ **Button:** Red pulsing microphone
- ✅ **Transcription:** Your words appear in quotes
- ✅ **Results:** Search results populate
- ✅ **Input Field:** Text appears in search box

### Common Issues & Solutions

#### Issue: "Microphone access denied"
**Solution:** Follow permission steps above

#### Issue: "No speech detected"
**Solution:** 
- Speak more clearly
- Check microphone is working
- Try different browser

#### Issue: "No microphone found"
**Solution:**
- Check microphone is connected
- Test microphone in other apps
- Restart browser

#### Issue: Voice button not visible
**Solution:**
- Use Chrome, Edge, or Safari
- Firefox is not supported

### Hardware Check
1. **Test microphone** in other apps (Zoom, Discord, etc.)
2. **Check system settings** for microphone permissions
3. **Try different browser** if issues persist
4. **Restart browser** after permission changes

### Still Need Help?
- Check browser console for detailed error messages
- Try voice search on other sites (Google.com voice search)
- Ensure microphone drivers are up to date
