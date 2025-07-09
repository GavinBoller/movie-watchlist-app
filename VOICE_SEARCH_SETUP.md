# Voice Search Setup for Development

Voice search requires microphone permissions, which browsers restrict on non-HTTPS localhost. Here are the solutions:

## Option 1: Enable Insecure Origins (Recommended for Development)

### For Microsoft Edge:
1. Type `edge://flags/` in the address bar
2. Search for "Insecure origins treated as secure"
3. Add `http://localhost:3000` to the list
4. Restart Edge
5. Refresh the app and try voice search

### For Google Chrome:
1. Type `chrome://flags/` in the address bar
2. Search for "Insecure origins treated as secure"
3. Add `http://localhost:3000` to the list
4. Restart Chrome
5. Refresh the app and try voice search

## Option 2: Manual Permission Setup

### For Microsoft Edge:
1. Type `edge://settings/content/microphone` in the address bar
2. Under "Allow", click "Add"
3. Enter `http://localhost:3000` and click "Add"
4. Refresh the app and try voice search

### For Google Chrome:
1. Type `chrome://settings/content/microphone` in the address bar
2. Under "Allowed to use your microphone", click "Add"
3. Enter `http://localhost:3000` and click "Add"
4. Refresh the app and try voice search

## Option 3: Use HTTPS in Development

Run the development server with HTTPS:
```bash
# Install mkcert for local SSL certificates
npm install -g mkcert
mkcert -install
mkcert localhost

# Then modify package.json or use a custom server
```

## Why This Happens

- **Security Policy**: Browsers block microphone access on HTTP localhost
- **Development vs Production**: This won't be an issue in production with HTTPS
- **Browser Security**: Modern browsers require secure contexts for sensitive APIs

## Testing Voice Search

Once permissions are set up:
1. Click the microphone icon in the search field
2. Allow microphone access when prompted
3. Speak your search query clearly
4. The app will search for your spoken words

## Troubleshooting

- **No permission prompt**: Try the "Insecure origins" method above
- **Permission denied**: Check browser microphone settings
- **Not working**: Refresh the page after changing browser settings
- **Still issues**: Try a different browser or use the manual permission setup
