#!/bin/sh
# CXY Zed Extension Installer
# Usage: curl -sSL https://raw.githubusercontent.com/dccarter/zed-cxy-extension/main/install.sh | sh
#
# This script installs the CXY language extension for Zed editor.
# It works on both Linux and macOS.

set -e

# Colors for output (if terminal supports it)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    BOLD='\033[1m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    BOLD=''
    NC=''
fi

# Configuration
REPO_URL="https://github.com/dccarter/zed-cxy-extension.git"
EXTENSION_NAME="cxy"
TEMP_DIR=""

# -----------------------------------------------------------------------------
# Helper functions
# -----------------------------------------------------------------------------

info() {
    printf "${BLUE}==>${NC} ${BOLD}%s${NC}\n" "$1"
}

success() {
    printf "${GREEN}✓${NC} %s\n" "$1"
}

warn() {
    printf "${YELLOW}⚠${NC} %s\n" "$1"
}

error() {
    printf "${RED}✗ Error:${NC} %s\n" "$1" >&2
}

die() {
    error "$1"
    cleanup
    exit 1
}

cleanup() {
    if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}

# Set up trap for cleanup on exit
trap cleanup EXIT INT TERM

# -----------------------------------------------------------------------------
# System detection
# -----------------------------------------------------------------------------

detect_os() {
    case "$(uname -s)" in
        Linux*)  OS="linux" ;;
        Darwin*) OS="macos" ;;
        *)       die "Unsupported operating system: $(uname -s)" ;;
    esac
}

detect_arch() {
    case "$(uname -m)" in
        x86_64|amd64)  ARCH="x86_64" ;;
        arm64|aarch64) ARCH="arm64" ;;
        *)             ARCH="$(uname -m)" ;;
    esac
}

get_zed_extensions_dir() {
    # Check various possible locations for Zed extensions
    if [ "$OS" = "macos" ]; then
        # macOS locations (in order of preference)
        if [ -d "$HOME/Library/Application Support/Zed/extensions" ]; then
            ZED_EXTENSIONS_DIR="$HOME/Library/Application Support/Zed/extensions"
        elif [ -d "$HOME/.config/zed/extensions" ]; then
            ZED_EXTENSIONS_DIR="$HOME/.config/zed/extensions"
        else
            # Default to the standard macOS location
            ZED_EXTENSIONS_DIR="$HOME/Library/Application Support/Zed/extensions"
        fi
    else
        # Linux locations
        if [ -d "$HOME/.local/share/zed/extensions" ]; then
            ZED_EXTENSIONS_DIR="$HOME/.local/share/zed/extensions"
        elif [ -d "$HOME/.config/zed/extensions" ]; then
            ZED_EXTENSIONS_DIR="$HOME/.config/zed/extensions"
        else
            # Default to XDG standard
            ZED_EXTENSIONS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/zed/extensions"
        fi
    fi
}

# -----------------------------------------------------------------------------
# Dependency checks
# -----------------------------------------------------------------------------

check_command() {
    command -v "$1" >/dev/null 2>&1
}

check_dependencies() {
    info "Checking dependencies..."

    MISSING_DEPS=""

    # Check for git
    if check_command git; then
        success "git found: $(git --version | head -1)"
    else
        MISSING_DEPS="$MISSING_DEPS git"
    fi

    # Check for node/npm
    if check_command node; then
        success "node found: $(node --version)"
    else
        MISSING_DEPS="$MISSING_DEPS node"
    fi

    if check_command npm; then
        success "npm found: $(npm --version)"
    else
        MISSING_DEPS="$MISSING_DEPS npm"
    fi

    # Check for tree-sitter CLI (optional, can use npx)
    if check_command tree-sitter; then
        success "tree-sitter found: $(tree-sitter --version 2>/dev/null || echo 'version unknown')"
        USE_NPX=false
    else
        if check_command npx; then
            success "tree-sitter will be run via npx"
            USE_NPX=true
        else
            MISSING_DEPS="$MISSING_DEPS npx"
        fi
    fi

    # Report missing dependencies
    if [ -n "$MISSING_DEPS" ]; then
        echo ""
        error "Missing required dependencies:$MISSING_DEPS"
        echo ""
        echo "Please install the missing dependencies:"
        echo ""

        case "$OS" in
            macos)
                echo "  Using Homebrew:"
                echo "    brew install git node"
                echo ""
                echo "  Or using the official installers:"
                echo "    - Git: https://git-scm.com/download/mac"
                echo "    - Node.js: https://nodejs.org/"
                ;;
            linux)
                echo "  Debian/Ubuntu:"
                echo "    sudo apt update && sudo apt install git nodejs npm"
                echo ""
                echo "  Fedora:"
                echo "    sudo dnf install git nodejs npm"
                echo ""
                echo "  Arch Linux:"
                echo "    sudo pacman -S git nodejs npm"
                ;;
        esac
        echo ""
        exit 1
    fi

    echo ""
}

check_zed_installed() {
    info "Checking for Zed editor..."

    ZED_FOUND=false

    # Check common Zed binary locations
    if check_command zed; then
        ZED_FOUND=true
        success "Zed found in PATH"
    elif [ "$OS" = "macos" ] && [ -d "/Applications/Zed.app" ]; then
        ZED_FOUND=true
        success "Zed.app found in /Applications"
    elif [ "$OS" = "macos" ] && [ -d "$HOME/Applications/Zed.app" ]; then
        ZED_FOUND=true
        success "Zed.app found in ~/Applications"
    elif [ -x "$HOME/.local/bin/zed" ]; then
        ZED_FOUND=true
        success "Zed found in ~/.local/bin"
    fi

    if [ "$ZED_FOUND" = "false" ]; then
        warn "Zed editor not found. The extension will be installed anyway."
        warn "Please install Zed from https://zed.dev/"
    fi

    echo ""
}

# -----------------------------------------------------------------------------
# Installation
# -----------------------------------------------------------------------------

fetch_extension() {
    info "Fetching CXY extension..."

    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"

    if ! git clone --depth 1 "$REPO_URL" "$EXTENSION_NAME" 2>&1; then
        die "Failed to clone repository from $REPO_URL"
    fi

    success "Extension fetched successfully"
    echo ""
}

build_grammar() {
    info "Building tree-sitter grammar..."

    cd "$TEMP_DIR/$EXTENSION_NAME/grammars/cxy"

    # Install npm dependencies
    if ! npm install --silent 2>&1; then
        die "Failed to install npm dependencies"
    fi
    success "Dependencies installed"

    # Generate the parser
    if [ "$USE_NPX" = "true" ]; then
        if ! npx tree-sitter generate 2>&1; then
            die "Failed to generate tree-sitter parser"
        fi
    else
        if ! tree-sitter generate 2>&1; then
            die "Failed to generate tree-sitter parser"
        fi
    fi
    success "Parser generated"

    # Build the WASM file
    if [ "$USE_NPX" = "true" ]; then
        if ! npx tree-sitter build --wasm -o ../cxy.wasm 2>&1; then
            die "Failed to build WASM grammar"
        fi
    else
        if ! tree-sitter build --wasm -o ../cxy.wasm 2>&1; then
            die "Failed to build WASM grammar"
        fi
    fi
    success "WASM grammar built"

    echo ""
}

install_extension() {
    info "Installing extension to Zed..."

    # Create the extensions directory if it doesn't exist
    mkdir -p "$ZED_EXTENSIONS_DIR/installed"

    INSTALL_DIR="$ZED_EXTENSIONS_DIR/installed/$EXTENSION_NAME"

    # Remove existing installation if present
    if [ -d "$INSTALL_DIR" ] || [ -L "$INSTALL_DIR" ]; then
        warn "Removing existing installation..."
        rm -rf "$INSTALL_DIR"
    fi

    # Copy the extension
    cd "$TEMP_DIR"
    cp -r "$EXTENSION_NAME" "$INSTALL_DIR"

    # Clean up unnecessary files from installed extension
    rm -rf "$INSTALL_DIR/.git" 2>/dev/null || true
    rm -rf "$INSTALL_DIR/grammars/cxy/node_modules" 2>/dev/null || true
    rm -f "$INSTALL_DIR/grammars/cxy/src/"*.c 2>/dev/null || true
    rm -f "$INSTALL_DIR/grammars/cxy/src/"*.h 2>/dev/null || true
    rm -f "$INSTALL_DIR/test.cxy" 2>/dev/null || true
    rm -f "$INSTALL_DIR/install.sh" 2>/dev/null || true

    success "Extension installed to: $INSTALL_DIR"
    echo ""
}

verify_installation() {
    info "Verifying installation..."

    INSTALL_DIR="$ZED_EXTENSIONS_DIR/installed/$EXTENSION_NAME"

    # Check required files exist
    MISSING_FILES=""

    [ -f "$INSTALL_DIR/extension.toml" ] || MISSING_FILES="$MISSING_FILES extension.toml"
    [ -f "$INSTALL_DIR/grammars/cxy.wasm" ] || MISSING_FILES="$MISSING_FILES grammars/cxy.wasm"
    [ -f "$INSTALL_DIR/languages/cxy/highlights.scm" ] || MISSING_FILES="$MISSING_FILES languages/cxy/highlights.scm"
    [ -d "$INSTALL_DIR/languages/cxy" ] || MISSING_FILES="$MISSING_FILES languages/cxy/"

    if [ -n "$MISSING_FILES" ]; then
        warn "Some files may be missing:$MISSING_FILES"
        warn "The extension may not work correctly."
    else
        success "All required files present"
    fi

    echo ""
}

print_success_message() {
    echo "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo "${GREEN}║${NC}          ${BOLD}CXY Extension Installed Successfully!${NC}              ${GREEN}║${NC}"
    echo "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. ${BOLD}Restart Zed${NC} (or reload extensions)"
    echo "     - Press Cmd+Shift+P (macOS) or Ctrl+Shift+P (Linux)"
    echo "     - Type 'zed: reload extensions' and press Enter"
    echo ""
    echo "  2. ${BOLD}Open a .cxy file${NC} to see syntax highlighting"
    echo ""
    echo "  3. ${BOLD}Use the outline panel${NC} (Cmd+Shift+O / Ctrl+Shift+O)"
    echo "     to navigate your code"
    echo ""
    echo "Installation location:"
    echo "  $INSTALL_DIR"
    echo ""
    echo "For issues or feedback, visit:"
    echo "  https://github.com/dccarter/zed-cxy-extension/issues"
    echo ""
}

# -----------------------------------------------------------------------------
# Uninstall function (can be called with --uninstall flag)
# -----------------------------------------------------------------------------

uninstall_extension() {
    detect_os
    get_zed_extensions_dir

    INSTALL_DIR="$ZED_EXTENSIONS_DIR/installed/$EXTENSION_NAME"

    info "Uninstalling CXY extension..."

    if [ -d "$INSTALL_DIR" ] || [ -L "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
        success "Extension removed from: $INSTALL_DIR"
        echo ""
        echo "Please restart Zed to complete the uninstallation."
    else
        warn "Extension not found at: $INSTALL_DIR"
        echo "It may have been installed in a different location or already removed."
    fi
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

main() {
    echo ""
    echo "${BOLD}CXY Zed Extension Installer${NC}"
    echo "============================"
    echo ""

    # Parse arguments
    case "${1:-}" in
        --uninstall|-u)
            uninstall_extension
            exit 0
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --help, -h        Show this help message"
            echo "  --uninstall, -u   Uninstall the extension"
            echo ""
            echo "Installation:"
            echo "  curl -sSL https://raw.githubusercontent.com/dccarter/zed-cxy-extension/main/install.sh | sh"
            echo ""
            exit 0
            ;;
    esac

    # Run installation
    detect_os
    detect_arch

    info "Detected: $OS ($ARCH)"
    echo ""

    get_zed_extensions_dir

    check_dependencies
    check_zed_installed
    fetch_extension
    build_grammar
    install_extension
    verify_installation
    print_success_message
}

main "$@"
