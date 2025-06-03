const { app, BrowserWindow, Menu, shell, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Check if icon file exists - do this at the module level so it's available everywhere
const iconPath = path.join(__dirname, 'assets', 'icon.icns');
const iconExists = fs.existsSync(iconPath);

if (!iconExists) {
    console.warn('Icon file not found at path:', iconPath);
}

function createWindow() {
    // Create a persistent session for maintaining login state
    const ses = session.fromPartition('persist:chatgpt');

    // Set more browser-like settings to avoid detection
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

    ses.setUserAgent(userAgent);

    // Handle CORS more securely - only for OpenAI domains
    ses.webRequest.onHeadersReceived((details, callback) => {
        const url = new URL(details.url);
        // Only modify headers for OpenAI domains
        if (url.hostname.includes('openai.com') || url.hostname.includes('chat.openai.com')) {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Access-Control-Allow-Origin': ['https://chat.openai.com'],
                    'Access-Control-Allow-Methods': ['GET, POST, OPTIONS'],
                    'Access-Control-Allow-Headers': ['Content-Type, Authorization']
                }
            });
        } else {
            callback({ responseHeaders: details.responseHeaders });
        }
    });

    // Set additional headers to appear more browser-like
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';
        details.requestHeaders['Accept-Language'] = 'en-US,en;q=0.9';
        details.requestHeaders['Accept-Encoding'] = 'gzip, deflate, br';
        details.requestHeaders['Cache-Control'] = 'max-age=0';
        details.requestHeaders['Pragma'] = 'no-cache';
        details.requestHeaders['Sec-Fetch-Dest'] = 'document';
        details.requestHeaders['Sec-Fetch-Mode'] = 'navigate';
        details.requestHeaders['Sec-Fetch-Site'] = 'none';
        details.requestHeaders['Sec-Fetch-User'] = '?1';
        details.requestHeaders['Upgrade-Insecure-Requests'] = '1';
        details.requestHeaders['sec-ch-ua'] = '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"';
        details.requestHeaders['sec-ch-ua-mobile'] = '?0';
        details.requestHeaders['sec-ch-ua-platform'] = '"macOS"';

        callback({ requestHeaders: details.requestHeaders });
    });

    // Create window options
    const windowOptions = {
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true, // Enable web security for better protection
            session: ses, // Use persistent session
            allowRunningInsecureContent: false, // Disable running insecure content for security
            experimentalFeatures: false
        },
        titleBarStyle: 'default',
        show: false // Don't show until ready
    };

    // Only set the icon if the file exists
    if (iconExists) {
        windowOptions.icon = iconPath;
    }

    mainWindow = new BrowserWindow(windowOptions);

    // Add debugging
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.log(`Failed to load: Code ${errorCode} - ${errorDescription}`);

        // Wait a moment and try again with a different approach
        setTimeout(() => {
            if (!mainWindow.isDestroyed()) {
                console.log('Retrying load with different parameters...');
                mainWindow.loadURL('https://chat.openai.com/?__cf_chl_rt_tk=disabled', {
                    userAgent: userAgent,
                    extraHeaders: 'pragma: no-cache\n'
                });
            }
        }, 3000);
    });

    // Add console log monitoring
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`Console [${level}]: ${message}`);
    });

    // Load ChatGPT with additional options
    mainWindow.loadURL('https://chat.openai.com', {
        userAgent: userAgent,
        extraHeaders: 'pragma: no-cache\n'
    });

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        // Inject some additional browser-like properties
        mainWindow.webContents.executeJavaScript(`
            // Make the app appear more like a regular browser
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });

            // Remove automation indicators
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;

            // Additional clouldflare bypassing
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });

            // Report success to console
            console.log('Navigation succeeded to: ' + window.location.href);
        `).catch(err => {
            console.error('Error in JS injection:', err);
        });
    });

    // Rest of your code...

    // Handle loading errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.log('Failed to load:', errorDescription);

        // Show error page with retry option
        mainWindow.loadURL(`data:text/html,
      <html lang="en">
        <head><title>Connection Error</title></head>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>Unable to Connect to ChatGPT</h1>
          <p>Error: ${errorDescription}</p>
          <p>This might happen due to:</p>
          <ul style="text-align: left; max-width: 400px; margin: 20px auto;">
            <li>Network connectivity issues</li>
            <li>OpenAI server maintenance</li>
            <li>Firewall or proxy blocking the connection</li>
          </ul>
          <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
            Retry Connection
          </button>
          <br><br>
          <small>Or try opening <a href="https://chat.openai.com" onclick="require('electron').shell.openExternal('https://chat.openai.com')">ChatGPT in your browser</a></small>
        </body>
      </html>
    `);
    });

    // Add better error handling for network issues
    mainWindow.webContents.on('did-finish-load', () => {
        // Check if we actually loaded ChatGPT or got an error page
        mainWindow.webContents.executeJavaScript(`
      document.title.includes('Just a moment') || 
      document.body.innerText.includes('upstream connect error') ||
      document.body.innerText.includes('502 Bad Gateway') ||
      document.body.innerText.includes('503 Service')
    `).then(isErrorPage => {
            if (isErrorPage) {
                console.log('Detected error page, will retry in 5 seconds...');
                setTimeout(() => {
                    if (!mainWindow.isDestroyed()) {
                        mainWindow.loadURL('https://chat.openai.com', {
                            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        });
                    }
                }, 5000);
            }
        }).catch(() => {}); // Ignore errors
    });

    // Handle external links - but allow auth flows
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        const parsedUrl = new URL(url);

        // Allow OpenAI auth domains to open in new windows within the app
        if (parsedUrl.hostname.includes('auth0.openai.com') ||
            parsedUrl.hostname.includes('openai.com') ||
            parsedUrl.hostname.includes('accounts.google.com') ||
            parsedUrl.hostname.includes('github.com') ||
            parsedUrl.hostname.includes('microsoft.com')) {
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    width: 500,
                    height: 700,
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true,
                        enableRemoteModule: false,
                        webSecurity: true
                    }
                }
            };
        }

        // Open other external links in default browser
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Allow navigation to auth-related OpenAI domains
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);

        // Allow navigation within OpenAI domains and auth providers
        const allowedDomains = [
            'chat.openai.com',
            'auth0.openai.com',
            'openai.com',
            'accounts.google.com',
            'login.microsoftonline.com',
            'github.com'
        ];

        const isAllowedDomain = allowedDomains.some(domain =>
            parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
        );

        if (!isAllowedDomain) {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        }
    });

    // Handle certificate errors
    mainWindow.webContents.on('certificate-error', (event, url, error, certificate, callback) => {
        // Allow self-signed certificates for localhost development
        if (url.startsWith('https://localhost') || url.startsWith('https://127.0.0.1')) {
            event.preventDefault();
            callback(true);
        } else {
            callback(false);
        }
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Create application menu
    createMenu();
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Chat',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.executeJavaScript(`
              const newChatButton = document.querySelector('[data-testid="new-chat-button"]') || 
                                  document.querySelector('button[aria-label*="new"]') ||
                                  document.querySelector('a[href="/"]');
              if (newChatButton) newChatButton.click();
            `);
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectall' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About ChatGPT Desktop',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About ChatGPT Desktop',
                            message: 'ChatGPT Desktop',
                            detail: 'A desktop wrapper for ChatGPT\nVersion 1.0.0'
                        });
                    }
                }
            ]
        }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services', submenu: [] },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });

        // Window menu
        template[4].submenu = [
            { role: 'close' },
            { role: 'minimize' },
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' }
        ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// App event listeners
app.whenReady().then(() => {
    // Skip setting the dock icon entirely to avoid white window issues
    // This is not critical for app functionality

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Security: Handle new window creation properly for auth flows
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);

        // Allow auth-related domains to open in new windows
        if (parsedUrl.hostname.includes('auth0.openai.com') ||
            parsedUrl.hostname.includes('openai.com') ||
            parsedUrl.hostname.includes('accounts.google.com') ||
            parsedUrl.hostname.includes('github.com') ||
            parsedUrl.hostname.includes('microsoft.com')) {
            return; // Allow the new window
        }

        // Prevent and redirect other new windows to external browser
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });

    // Handle when auth windows close and redirect back
    contents.on('will-redirect', (event, url) => {
        if (url.startsWith('https://chat.openai.com')) {
            // If it's redirecting back to ChatGPT, load it in the main window
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.loadURL(url);
                mainWindow.focus();
            }
        }
    });
});

// Handle protocol for macOS
app.setAsDefaultProtocolClient('chatgpt-desktop');
