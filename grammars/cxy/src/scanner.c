#include "tree_sitter/parser.h"
#include <string.h>
#include <stdlib.h>

// Token types - must match the order in grammar.js externals array
enum TokenType {
  BLOCK_OPEN,
  COMPTIME_EXPAND_OPEN,
  COMPTIME_EXPAND_CLOSE,
};

// Scanner state: tracks how deep we are inside #{ ... } nesting
typedef struct {
  int comptime_depth;
} Scanner;

void *tree_sitter_cxy_external_scanner_create(void) {
  Scanner *s = malloc(sizeof(Scanner));
  s->comptime_depth = 0;
  return s;
}

void tree_sitter_cxy_external_scanner_destroy(void *payload) {
  free(payload);
}

unsigned tree_sitter_cxy_external_scanner_serialize(void *payload, char *buffer) {
  Scanner *s = (Scanner *)payload;
  buffer[0] = (char)s->comptime_depth;
  return 1;
}

void tree_sitter_cxy_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  Scanner *s = (Scanner *)payload;
  s->comptime_depth = (length > 0) ? (unsigned char)buffer[0] : 0;
}

static void skip_whitespace_and_comments(TSLexer *lexer) {
  for (;;) {
    // Skip whitespace
    while (lexer->lookahead == ' '  ||
           lexer->lookahead == '\t' ||
           lexer->lookahead == '\n' ||
           lexer->lookahead == '\r') {
      lexer->advance(lexer, true);
    }
    // Skip line comments
    if (lexer->lookahead == '/') {
      // Peek ahead — we can't un-advance, so mark end here
      lexer->advance(lexer, true);
      if (lexer->lookahead == '/') {
        lexer->advance(lexer, true);
        while (lexer->lookahead != '\n' && lexer->lookahead != 0) {
          lexer->advance(lexer, true);
        }
        continue;
      }
      // Not a comment — we consumed a '/' we shouldn't have.
      // Return and let the grammar handle it (this is rare here).
      return;
    }
    break;
  }
}

bool tree_sitter_cxy_external_scanner_scan(void *payload, TSLexer *lexer,
                                            const bool *valid_symbols) {
  Scanner *s = (Scanner *)payload;

  // -------------------------------------------------------------------------
  // COMPTIME_EXPAND_OPEN: match '#{'
  // -------------------------------------------------------------------------
  if (valid_symbols[COMPTIME_EXPAND_OPEN]) {
    skip_whitespace_and_comments(lexer);
    if (lexer->lookahead == '#') {
      lexer->advance(lexer, false);
      if (lexer->lookahead == '{') {
        lexer->advance(lexer, false);
        s->comptime_depth++;
        lexer->result_symbol = COMPTIME_EXPAND_OPEN;
        return true;
      }
    }
  }

  // -------------------------------------------------------------------------
  // COMPTIME_EXPAND_CLOSE: match '}' that closes a '#{' block
  // -------------------------------------------------------------------------
  if (valid_symbols[COMPTIME_EXPAND_CLOSE] && s->comptime_depth > 0) {
    skip_whitespace_and_comments(lexer);
    if (lexer->lookahead == '}') {
      lexer->advance(lexer, false);
      s->comptime_depth--;
      lexer->result_symbol = COMPTIME_EXPAND_CLOSE;
      return true;
    }
  }

  // -------------------------------------------------------------------------
  // BLOCK_OPEN: zero-width token emitted just before '{' to signal that the
  // expression before it is a complete condition (not a struct literal name).
  // We do NOT consume the '{' — the grammar rule does that.
  // -------------------------------------------------------------------------
  if (valid_symbols[BLOCK_OPEN]) {
    skip_whitespace_and_comments(lexer);
    if (lexer->lookahead == '{') {
      lexer->result_symbol = BLOCK_OPEN;
      return true;
    }
  }

  return false;
}