; Comments
(line_comment) @comment
(block_comment) @comment

; Keywords
[
  "func"
  "var"
  "const"
  "type"
  "struct"
  "class"
  "enum"
  "interface"
  "module"
  "import"
  "from"
  "as"
  "pub"
  "extern"
  "native"
  "async"
  "await"
  "defer"
  "unsafe"
  "macro"
  "test"
  "opaque"
  "virtual"
  "exception"
  "asm"
] @keyword

; Control flow
[
  "if"
  "else"
  "match"
  "switch"
  "case"
  "default"
  "for"
  "in"
  "while"
  "break"
  "continue"
  "return"
  "raise"
  "catch"
] @keyword.control

; Storage/type keywords
[
  "void"
  "bool"
  "char"
  "string"
  "__string"
  "range"
  "auto"
] @type.builtin

; Numeric types
[
  "i8" "i16" "i32" "i64"
  "u8" "u16" "u32" "u64"
  "f32" "f64"
  "time_t"
] @type.builtin

; Boolean literals
[
  "true"
  "false"
  "null"
] @constant.builtin

; Special identifiers
[
  "this"
  "This"
  "super"
  "defined"
] @variable.builtin

; String literals
(string_literal) @string
(char_literal) @character

; Numeric literals
(integer_literal) @number
(float_literal) @number.float

; Identifiers
(identifier) @variable

; Function definitions and calls
(function_declaration
  name: (identifier) @function)
(function_call
  function: (identifier) @function)

; Type names
(type_identifier) @type
(primitive_type) @type.builtin

; Struct/class/enum names
(struct_declaration
  name: (identifier) @type)
(class_declaration
  name: (identifier) @type)
(enum_declaration
  name: (identifier) @type)

; Field names
(field_declaration
  name: (identifier) @property)
(field_expression
  field: (identifier) @property)

; Method calls
(method_call
  method: (identifier) @function.method)

; Generic type parameters
(type_parameter (identifier) @type.parameter)
(generic_type
  name: (identifier) @type)

; Attributes and annotations
(attribute) @attribute
(annotation) @attribute

; Preprocessor directives
(preprocessor_directive) @preproc
(macro_invocation) @function.macro

; Compile-time expressions
(comptime_expression) @keyword.directive
(comptime_block) @keyword.directive

; Operators
[
  "+"
  "-"
  "*"
  "/"
  "%"
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "&="
  "|="
  "^="
  "<<="
  ">>="
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "&&"
  "||"
  "!"
  "&"
  "|"
  "^"
  "~"
  "<<"
  ">>"
  "++"
  "--"
  "?"
  ":"
  "=>"
  ".."
  "..."
  "@"
  "#"
  "##"
  "#."
  "!:"
  "!!"
  "??"
  "?."
] @operator

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
  ";"
  ","
  "."
] @punctuation.delimiter

; Special punctuation for templates/generics
[
  "#{"
  ".["
] @punctuation.special

; Error handling
"catch" @keyword.control.exception
"raise" @keyword.control.exception
"exception" @keyword.control.exception

; Async/await
"async" @keyword.coroutine
"await" @keyword.coroutine

; Memory management
[
  "defer"
  "unsafe"
  "ptrof"
  "__copy"
] @keyword.storage

; Visibility modifiers
"pub" @keyword.modifier
"extern" @keyword.modifier
"native" @keyword.modifier
"virtual" @keyword.modifier
"opaque" @keyword.modifier

; Test keyword
"test" @keyword.directive

; Import statements
(import_declaration
  "import" @keyword.import)
(import_declaration
  "from" @keyword.import)
(import_declaration
  "as" @keyword.import)

; Module declarations
(module_declaration
  "module" @keyword.import
  name: (identifier) @module)

; Escape sequences in strings
(escape_sequence) @string.escape

; Field access with private marker
(field_declaration
  name: (identifier) @property.private
  (#match? @property.private "^-"))

; Constants (ALL_CAPS identifiers)
((identifier) @constant
 (#match? @constant "^[A-Z][A-Z_0-9]*$"))

; Generic constraints
"where" @keyword.control

; Pattern matching
"match" @keyword.control.conditional
"case" @keyword.control.conditional

; Inline assembly
"asm" @keyword.directive
