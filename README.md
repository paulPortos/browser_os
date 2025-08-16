# BrowserOS

A fully functional browser-based operating system built with HTML, CSS, and JavaScript. BrowserOS provides a desktop-like experience with a Unix/Mac-inspired interface, complete with applications, file management, and system utilities.

## Features

### 🖥️ Desktop Environment
- **Mac-style Interface**: Clean, modern design inspired by macOS
- **Desktop Icons**: Draggable desktop shortcuts for quick application access
- **Context Menus**: Right-click context menus for desktop and application interactions
- **Desktop Backgrounds**: Customizable background gradients

### 🧭 Menu Bar
- **System Menu**: Apple-style menu with system options
- **Application Menus**: Context-sensitive menus for active applications
- **System Status**: Real-time display of time, battery, and network status
- **System Information**: Built-in system information and help dialogs

### 🚀 Dock
- **Mac-style Dock**: Bottom-centered application launcher
- **Hover Effects**: Smooth scaling animations on hover
- **App Indicators**: Visual indicators for running applications
- **Context Menus**: Right-click menus for dock applications

### 📱 Applications

#### 📁 Finder (File Manager)
- **File Browser**: Navigate through mock file system
- **Multiple Views**: List and grid view modes
- **Search**: File search functionality
- **Sidebar Navigation**: Quick access to common folders
- **Toolbar**: Navigation controls and view options

#### ⚫ Terminal
- **Command Line Interface**: Full terminal emulator
- **Command History**: Navigate through previous commands
- **Tab Completion**: Auto-complete for common commands
- **Multiple Commands**: Support for common Unix commands (ls, cd, cat, etc.)
- **Keyboard Shortcuts**: Standard terminal shortcuts

#### 📝 TextEdit
- **Rich Text Editor**: Full-featured text editor
- **File Operations**: New, open, save functionality
- **Auto-save**: Automatic saving of changes
- **Font Controls**: Customizable fonts and sizes
- **Statistics**: Real-time character and line counts

#### 🧮 Calculator
- **Scientific Calculator**: Full calculator functionality
- **Memory Functions**: Memory store and recall
- **Keyboard Support**: Full keyboard input support
- **Visual Feedback**: Button press animations and operation highlighting

#### 🌐 Browser
- **Simple Web Browser**: Basic browser interface
- **Navigation Controls**: Back, forward, refresh buttons
- **Address Bar**: URL input field

#### ⚙️ System Preferences
- **Settings Panel**: System configuration interface
- **Theme Options**: Appearance customization
- **System Options**: Various system settings

### 🛠️ System Utilities

#### Window Management
- **Multiple Windows**: Support for multiple application windows
- **Window Controls**: Close, minimize, maximize buttons
- **Drag & Drop**: Draggable windows with collision detection
- **Resize**: Resizable windows with constraints
- **Focus Management**: Proper window focus and z-index handling

#### Event System
- **Global Events**: System-wide event management
- **Component Communication**: Inter-component messaging
- **Custom Events**: Support for custom application events

#### System Services
- **Auto-save**: Automatic saving of application states
- **System Clock**: Real-time clock display
- **Battery Monitor**: Battery status tracking
- **Network Status**: Online/offline detection

## Project Structure

```
browser_os/
├── index.html                 # Main HTML file
├── src/
│   ├── styles/               # CSS stylesheets
│   │   ├── main.css         # Global styles and animations
│   │   ├── desktop.css      # Desktop and icon styles
│   │   ├── dock.css         # Dock and launcher styles
│   │   ├── menubar.css      # Menu bar styles
│   │   └── widgets.css      # Widget and modal styles
│   ├── utilities/            # Backend utilities
│   │   ├── EventManager.js  # Global event system
│   │   ├── WindowManager.js # Window management system
│   │   └── SystemUtils.js   # System utilities and helpers
│   ├── widgets/             # UI widgets
│   │   ├── MenuBar.js       # Top menu bar component
│   │   ├── Dock.js          # Application dock component
│   │   └── Desktop.js       # Desktop and icon management
│   ├── applications/         # Individual applications
│   │   ├── Finder.js        # File manager application
│   │   ├── Terminal.js      # Terminal emulator
│   │   ├── TextEditor.js    # Text editor application
│   │   ├── Calculator.js    # Calculator application
│   │   ├── Browser.js       # Simple browser
│   │   └── Settings.js      # System preferences
│   └── main.js              # Main application entry point
├── assets/
│   └── icons/               # Application icons (future)
└── README.md                # This file
```

## Getting Started

1. **Clone or Download** the project files
2. **Open `index.html`** in a modern web browser
3. **Enjoy BrowserOS!** The system will boot automatically

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Screen resolution: 1024x768 or higher recommended

## Usage

### Basic Navigation
- **Click** desktop icons or dock items to launch applications
- **Right-click** on desktop or applications for context menus
- **Drag** windows to move them around
- **Double-click** window title bars to maximize/restore

### Keyboard Shortcuts
- `Cmd/Ctrl + Q`: Quit active application
- `Cmd/Ctrl + W`: Close active window
- `Cmd/Ctrl + M`: Minimize active window
- `F11`: Toggle fullscreen mode
- `Cmd/Ctrl + Space`: Spotlight search (coming soon)
- `Cmd/Ctrl + Tab`: Application switcher (coming soon)

### Terminal Commands
Common commands available in the terminal:
- `help`: Show available commands
- `ls`, `dir`: List directory contents
- `cd`: Change directory
- `pwd`: Print working directory
- `echo`: Display text
- `cat`: Display file contents
- `clear`: Clear terminal
- `exit`: Close terminal

## Customization

### Adding New Applications
1. Create a new application class in `src/applications/`
2. Follow the existing application pattern
3. Register the application in the dock (modify `src/widgets/Dock.js`)
4. Add the script tag to `index.html`

### Modifying Styles
- Global styles: Edit `src/styles/main.css`
- Component-specific styles: Edit the relevant CSS file
- Application styles: Include styles within the application's content

### Custom Desktop Backgrounds
Modify the gradient in `src/styles/desktop.css` or use the background changer in the desktop context menu.

## Browser Compatibility

BrowserOS is tested and works on:
- ✅ Chrome/Chromium 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## Known Limitations

- File system operations are simulated (no real file I/O)
- Network operations are mocked
- Some browser security restrictions apply
- Performance depends on browser and system resources

## Future Enhancements

- [ ] Real file system integration (where possible)
- [ ] More applications (games, media player, etc.)
- [ ] Drag and drop file operations
- [ ] Tabbed applications
- [ ] Virtual desktop support
- [ ] Themes and customization options
- [ ] Progressive Web App (PWA) support
- [ ] Offline functionality
- [ ] Cloud storage integration

## Contributing

This is a demonstration project, but feel free to:
1. Fork the repository
2. Add new features or applications
3. Improve existing functionality
4. Fix bugs or optimize performance

## License

This project is open source and available under the MIT License.

## Credits

- **Design Inspiration**: macOS and modern desktop environments
- **Icons**: Unicode emojis for cross-platform compatibility
- **Fonts**: System fonts for native feel

---

**BrowserOS v1.0.0** - A complete desktop experience in your browser! 🖥️✨
