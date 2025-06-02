# ChatGPT Desktop App

A simple Electron-based desktop wrapper for ChatGPT that works on Intel Macs and other platforms, as OpenAI's ChatGPT App is not gonna support Intel Macs 🤷‍♂️

## Features

- 🖥️ Native desktop experience for ChatGPT
- 🔒 Secure wrapper with proper web security
- ⌨️ Keyboard shortcuts (Cmd/Ctrl+N for new chat)
- 🎯 External links open in your default browser
- 📱 Responsive window sizing
- 🍎 macOS menu bar integration

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

## Installation & Setup

1. **Create a new directory for your project:**
   ```bash
   mkdir chatgpt-desktop
   cd chatgpt-desktop
   ```

2. **Save the provided files:**
    - Save `package.json`
    - Save `main.js`
    - Save this `README.md`

3. **Install dependencies:**
   ```bash
   npm install
   ```
   ```bash
   yarn install
   ```
   ```bash
   bun install
   ```

4. **Run the application:**
   ```bash
   npm start
   ```
   ```bash
   yarn start
   ```
   ```bash
   bun start
   ```

## Building for Distribution

To create a distributable package:

```bash
# Install electron-builder globally (optional)
npm install -g electron-builder

# Build for your current platform
npm run dist
```

This will create a `dist` folder with the packaged application.

### Platform-specific builds:

```bash
# For macOS (creates .dmg)
electron-builder --mac

# For Windows (creates .exe installer)
electron-builder --win

# For Linux (creates AppImage)
electron-builder --linux
```

## Keyboard Shortcuts

- **Cmd/Ctrl + N**: New Chat
- **Cmd/Ctrl + R**: Reload page
- **Cmd/Ctrl + Shift + I**: Toggle Developer Tools
- **Cmd/Ctrl + Plus/Minus**: Zoom in/out
- **Cmd/Ctrl + 0**: Reset zoom

## Customization

### Adding an Icon

1. Create an `assets` folder in your project directory
2. Add your icon file as `icon.png` (or update the path in `main.js`)
3. For better results, provide multiple sizes:
    - `icon.icns` for macOS
    - `icon.ico` for Windows
    - `icon.png` for Linux

### Modifying Window Size

Edit the `createWindow()` function in `main.js`:

```javascript
mainWindow = new BrowserWindow({
  width: 1400,    // Change width
  height: 900,    // Change height
  minWidth: 1000, // Change minimum width
  minHeight: 700, // Change minimum height
  // ... other options
});
```

### Adding Custom Features

You can extend the app by:
- Adding more menu items
- Implementing custom keyboard shortcuts
- Adding notification support
- Implementing auto-updater functionality

## Troubleshooting

### Common Issues:

1. **"Module not found" errors:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **App won't start:**
    - Check that all files are in the same directory
    - Ensure Node.js version is 16+
    - Try running `npm start` from the project directory

3. **Blank window:**
    - Check your internet connection
    - The app loads chat.openai.com, so you need internet access

4. **Build errors:**
    - Make sure electron-builder is installed: `npm install electron-builder --save-dev`
    - Try deleting `dist` folder and rebuilding

## Security Notes

This app includes several security measures:
- External links open in your default browser
- Node integration is disabled in the renderer process
- Context isolation is enabled
- Web security is maintained

## License

MIT License - feel free to modify and distribute as needed.

## Contributing

This is a simple wrapper app. Feel free to fork and enhance it with additional features like:
- Dark/light theme switching
- Custom CSS injection
- Notification support
- Auto-updater
- Multiple account support
