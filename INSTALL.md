# Installation Guide for Cxy Zed Extension

This guide will help you install and set up syntax highlighting for the Cxy programming language in Zed editor.

## Prerequisites

- [Zed editor](https://zed.dev/) installed on your system
- Basic familiarity with terminal/command line

## Installation Methods

### Method 1: Manual Installation (Recommended)

1. **Clone or download this extension:**
   ```bash
   git clone https://github.com/cxy-lang/zed-cxy-extension.git
   # OR download and extract the ZIP file
   ```

2. **Create the Zed extensions directory (if it doesn't exist):**
   ```bash
   mkdir -p ~/.config/zed/extensions
   ```

3. **Link the extension to your Zed extensions directory:**
   ```bash
   ln -s /path/to/zed-cxy-extension ~/.config/zed/extensions/cxy
   ```
   
   Replace `/path/to/zed-cxy-extension` with the actual path where you cloned/extracted the extension.

4. **Restart Zed editor**

### Method 2: Direct Copy

If you prefer not to use symbolic links:

1. **Copy the extension to Zed's extensions directory:**
   ```bash
   cp -r zed-cxy-extension ~/.config/zed/extensions/cxy
   ```

2. **Restart Zed editor**

## Verification

To verify the extension is working:

1. **Open a Cxy file** (`.cxy` extension) in Zed
2. **Check syntax highlighting** - keywords like `func`, `struct`, `class` should be highlighted
3. **Open the outline panel** - you should see functions, structs, and other declarations listed

## Building Tree-sitter Grammar (Optional)

If you want to build the tree-sitter grammar from source:

1. **Install Node.js and npm** (if not already installed)

2. **Navigate to the grammar directory:**
   ```bash
   cd ~/.config/zed/extensions/cxy/grammars/cxy
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Build the grammar:**
   ```bash
   npx tree-sitter generate
   npx tree-sitter build-wasm
   ```

## Configuration

### File Association

The extension automatically associates `.cxy` files with Cxy syntax highlighting. If you need to manually set the language for a file:

1. Open the file in Zed
2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Linux/Windows)
3. Type "Select Language"
4. Choose "Cxy"

### Custom Settings

You can customize the extension behavior by modifying your Zed settings. Open `~/.config/zed/settings.json` and add:

```json
{
  "languages": {
    "Cxy": {
      "tab_size": 4,
      "hard_tabs": false,
      "soft_wrap": "preferred_line_length"
    }
  }
}
```

## Troubleshooting

### Extension Not Loading

1. **Check the directory structure:**
   ```
   ~/.config/zed/extensions/cxy/
   ├── extension.toml
   ├── languages/
   │   └── cxy/
   │       ├── highlights.scm
   │       ├── injections.scm
   │       └── outline.scm
   └── grammars/
       └── cxy/
           ├── grammar.js
           └── package.json
   ```

2. **Verify extension.toml syntax** - ensure it's valid TOML format

3. **Check Zed logs:**
   - macOS: `~/Library/Logs/Zed/Zed.log`
   - Linux: `~/.local/state/zed/logs/Zed.log`

### Syntax Highlighting Not Working

1. **Ensure file has `.cxy` extension**
2. **Manually select Cxy language** (see Configuration section above)
3. **Restart Zed** after making any changes to the extension

### Performance Issues

If you experience slow performance with large Cxy files:

1. **Disable unnecessary features** in settings:
   ```json
   {
     "languages": {
       "Cxy": {
         "enable_language_server": false,
         "show_whitespaces": "none"
       }
     }
   }
   ```

## Uninstallation

To remove the extension:

```bash
rm -rf ~/.config/zed/extensions/cxy
```

Then restart Zed.

## Getting Help

- **Issues**: Report problems at [GitHub Issues](https://github.com/cxy-lang/zed-cxy-extension/issues)
- **Discussions**: Join discussions at [Cxy Community](https://github.com/dccarter/cxy/discussions)
- **Documentation**: See the main [README.md](README.md) for feature details

## Next Steps

After successful installation:

1. **Try opening some Cxy example files** from the main Cxy repository
2. **Explore the outline panel** to navigate code structure
3. **Customize your settings** for optimal development experience
4. **Consider contributing** improvements back to the extension

Happy coding with Cxy! 🚀