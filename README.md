# New Tab Chrome Extension

A beautiful, minimal, and highly customizable Chrome extension that replaces your new tab page with a personalized dashboard featuring pinned apps, clock, stats, and customizable backgrounds.

## ✨ Features

### 🎯 Core Functionality
- **Pinned Apps Grid**: 2×10 customizable grid of your favorite websites
- **Beautiful Clock**: Large, clean typography with 12/24 hour format options
- **Usage Statistics**: Track browser usage time, tabs opened, and days used
- **Custom Backgrounds**: Multiple background options including uploads, colors, gradients, and APIs

### 🎨 Customization Options
- **Clock Settings**: Toggle between 12/24 hour format, show/hide seconds and date
- **App Grid**: Adjustable padding, transparency, show/hide app names
- **Backgrounds**: 
  - Upload multiple images with cycling options
  - Solid colors with color picker
  - Gradient presets with custom colors
  - API integration (Unsplash, Pexels) with custom API keys
- **Stats Display**: Toggle individual stat items on/off

### 🚀 Advanced Features
- **Drag & Drop**: Reorder pinned apps with smooth animations
- **Import/Export**: Backup and restore your configuration
- **Responsive Design**: Works perfectly on all screen sizes
- **Glassmorphism**: Beautiful blur and transparency effects
- **Keyboard Shortcuts**: Quick access to settings (Ctrl+,)

## 📁 Project Structure

```
extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── index.html            # Main new tab page
├── options.html          # Extension options page
├── assets/               # Icons and images
├── scripts/              # JavaScript modules
│   ├── app.js           # Main application coordinator
│   ├── clock.js         # Clock module
│   ├── pinned-apps.js   # Pinned apps grid manager
│   ├── background.js    # Background engine
│   ├── settings.js      # Settings modal manager
│   ├── stats.js         # Usage statistics tracker
│   └── options.js       # Options page functionality
└── styles/              # CSS stylesheets
    ├── main.css         # Main styles and variables
    ├── components.css   # Component-specific styles
    ├── settings.css     # Settings modal styles
    └── options.css      # Options page styles
```

## 🚀 Installation

### Method 1: Load Unpacked (Development)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will be installed and ready to use!

### Method 2: Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "New Tab Extension"
3. Click "Add to Chrome"
4. Confirm the installation

## 🎮 Usage

### Setting Up Your New Tab
1. **Open a new tab** - Your new dashboard will appear
2. **Click the settings icon** (⚙️) in the top right
3. **Customize your layout**:
   - Add pinned apps by clicking "Add App"
   - Upload background images or choose colors/gradients
   - Configure clock format and visibility
   - Toggle stats display options

### Managing Pinned Apps
- **Add apps**: Click "Add App" in settings and enter URL/name
- **Edit apps**: Right-click any app and select "Edit"
- **Reorganize**: Drag and drop apps to reorder them
- **Upload icons**: Use custom icons or fetch from site favicons

### Background Options
- **Upload Images**: Add multiple images with cycling options
- **Solid Colors**: Choose any color with the color picker
- **Gradients**: Select from presets or create custom gradients
- **API Images**: Connect to Unsplash or Pexels for random images

### Keyboard Shortcuts
- `Ctrl + ,` - Open settings
- `Escape` - Close any modal

## ⚙️ Configuration

### Background API Setup
To use Unsplash or Pexels APIs:
1. Get your API key from:
   - [Unsplash Developers](https://unsplash.com/developers)
   - [Pexels API](https://www.pexels.com/api/)
2. Enter your API key in settings
3. Configure search queries and cycling options

### Import/Export Settings
- **Export**: Save your complete configuration as JSON
- **Import**: Restore settings from a previous export
- **Reset**: Return to default settings

## 🛠️ Development

### Building from Source
1. Clone the repository
2. Make your changes to the code
3. Test by loading unpacked in Chrome
4. Package for distribution if needed

### Code Structure
The extension uses a modular architecture:
- Each feature is a separate JavaScript class
- Settings are stored in `chrome.storage.sync`
- Event-driven communication between modules
- Modern ES6+ JavaScript with async/await

## 🎨 Customization

### CSS Variables
The extension uses CSS custom properties for easy theming:
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --bg-primary: rgba(0, 0, 0, 0.3);
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
}
```

### Adding New Features
1. Create a new JavaScript module in `scripts/`
2. Add corresponding HTML elements to `index.html`
3. Style with CSS in appropriate stylesheet
4. Initialize in `app.js`
5. Add settings integration if needed

## 🔒 Privacy & Security

- **Local Storage**: All settings are stored locally in your browser
- **No Tracking**: No user data is sent to external servers
- **API Keys**: Your API keys are stored locally and only used for background images
- **Permissions**: Only requests necessary permissions for functionality

## 🐛 Troubleshooting

### Common Issues
- **Extension not loading**: Check that all files are in the correct location
- **Settings not saving**: Ensure `chrome.storage.sync` is available
- **Background images not loading**: Check file formats and sizes
- **Apps not opening**: Verify URLs are valid and include https://

### Reset Everything
1. Open the options page (right-click extension icon → Options)
2. Click "Reset All Data"
3. Confirm the action
4. Extension will reset to defaults

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Icons from [Heroicons](https://heroicons.com/)
- Gradient presets inspired by [Gradient Hunt](https://gradienthunt.com/)
- Glassmorphism effects from various CSS tutorials

## 📞 Support

- **Issues**: Report bugs via GitHub Issues
- **Features**: Suggest new features in Discussions
- **Questions**: Check the FAQ or ask in Discussions

---

**Enjoy your beautiful new tab experience!** 🎉