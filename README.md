# CXY Language Extension for Zed

Syntax highlighting and code navigation for the [CXY programming language](https://github.com/cxy-lang/cxy) in Zed.

## Quick Install

```bash
curl -sSL https://raw.githubusercontent.com/cxy-lang/zed-cxy-extension/main/install.sh | sh
```

**Requirements:** git, node, npm

## Manual Install

1. **Clone & build:**
   ```bash
   git clone https://github.com/cxy-lang/zed-cxy-extension.git
   cd zed-cxy-extension/grammars/cxy
   npm install
   npx tree-sitter generate
   npx tree-sitter build --wasm -o ../cxy.wasm
   ```

2. **Copy to Zed:**
   
   macOS:
   ```bash
   cp -r ../../ "$HOME/Library/Application Support/Zed/extensions/installed/cxy"
   ```
   
   Linux:
   ```bash
   cp -r ../../ "$HOME/.local/share/zed/extensions/installed/cxy"
   ```

3. **Restart Zed**

## Uninstall

```bash
curl -sSL https://raw.githubusercontent.com/cxy-lang/zed-cxy-extension/main/install.sh | sh -s -- --uninstall
```

## Troubleshooting

- Restart Zed or run "zed: reload extensions" from command palette
- Check that `.cxy` files are recognized (manually select "Cxy" language if needed)
- Verify the wasm file exists: `grammars/cxy.wasm`

## Links

- [CXY Language](https://github.com/cxy-lang/cxy)
- [Report Issues](https://github.com/cxy-lang/zed-cxy-extension/issues)
