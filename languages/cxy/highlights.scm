; ===========================================================================
; Comments
; ===========================================================================
(line_comment) @comment
(block_comment) @comment

; ===========================================================================
; Keywords
; ===========================================================================
[
  "func"
  "var"
  "const"
  "type"
  "struct"
  "class"
  "enum"
  "module"
  "package"
  "plugin"
  "import"
  "export"
  "from"
  "as"
  "pub"
  "extern"
  "native"
  "async"
  "virtual"
  "macro"
  "test"
  "exception"
  "delete"
  "ptrof"
  "launch"
  "is"
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
  "defer"
  "discard"
] @keyword.control

; Compile-time keywords
[
  "#if"
  "##if"
  "#for"
  "#const"
  "defined"
] @keyword.directive

; Visibility / modifiers
[
  "pub"
  "extern"
  "native"
  "virtual"
] @keyword.modifier

; Memory / async
[
  "async"
  "launch"
  "ptrof"
  "delete"
] @keyword.storage

; ===========================================================================
; Types
; ===========================================================================
(primitive_type) @type.builtin

(struct_declaration name: (identifier) @type)
(class_declaration  name: (identifier) @type)
(enum_declaration   name: (identifier) @type)
(type_declaration   name: (identifier) @type)
(named_type)        @type
(generic_type name: (identifier) @type)
(type_parameter name: (identifier) @type.parameter)

; ===========================================================================
; Declarations
; ===========================================================================

; Function names
(function_declaration
  name: (identifier) @function)
(expression_function_declaration
  name: (identifier) @function)

; Operator overload names  e.g. `init`, `==`
(function_declaration
  name: (operator_name) @function.special)
(expression_function_declaration
  name: (operator_name) @function.special)

; Module
(module_declaration
  name: (identifier) @module)

; Enum variants
(enum_variant name: (identifier) @constant)

; Field declarations
(field_declaration name: (identifier) @property)

; Type alias inside struct/class  (type elementType = T)
(type_alias_member name: (identifier) @type)

; Annotation member  (`noComparator = true)
(annotation_member) @attribute

; ===========================================================================
; Calls & field access
; ===========================================================================
(call_expression
  function: (identifier) @function.call)
(call_expression
  function: (field_expression field: (identifier) @function.method))
(call_expression
  function: (pointer_field_expression field: (identifier) @function.method))

(field_expression      field: (identifier) @property)
(pointer_field_expression field: (identifier) @property)

; Macro invocations  e.g. ok!(), sizeof!()
(macro_invocation name: (identifier) @function.macro)

; ===========================================================================
; Variables & parameters
; ===========================================================================
(parameter  name: (identifier) @variable.parameter)
(lambda_parameter name: (identifier) @variable.parameter)

; Special built-in identifiers
((identifier) @variable.builtin
  (#match? @variable.builtin "^(this|super)$"))

(this_literal) @variable.builtin
(super_literal) @variable.builtin

; Constants — ALL_CAPS
((identifier) @constant
  (#match? @constant "^[A-Z][A-Z0-9_]+$"))

(identifier) @variable

; ===========================================================================
; Literals
; ===========================================================================
(string_literal)       @string
(string_interpolation) @string.special
(char_literal)         @string
(integer_literal)      @number
(float_literal)        @number.float
(boolean_literal)      @constant.builtin
(null_literal)         @constant.builtin

; ===========================================================================
; Attributes  @inline, @[prop, inline]
; ===========================================================================
(attribute_declaration) @attribute
(attribute_item name: (identifier) @attribute)




; ===========================================================================
; Comptime expand #{ }
; ===========================================================================
(comptime_expand) @punctuation.special

; ===========================================================================
; Typeinfo & Tuple Transform
; ===========================================================================

; #T, #i32, #(bool, i32)  — typeinfo prefix
(typeinfo_expression) @keyword.directive

; #`T as M, i => ...`  — tuple type transformation
(tuple_transform_expression) @keyword.directive

; ===========================================================================
; Operators
; ===========================================================================
[
  "+"  "-"  "*"  "/"  "%"
  "="  "+=" "-=" "*=" "/=" "%="
  "&=" "|=" "^=" "<<=" ">>="
  "==" "!=" "<"  ">"  "<=" ">="
  "&&" "||" "!"  "&"  "|"  "^"  "~"
  "<<" ">>" "++" "--"
  "=>" ".." "!:" "as"
  "&&"
] @operator

; ===========================================================================
; Punctuation
; ===========================================================================
[ "(" ")" "[" "]" "{" "}" ] @punctuation.bracket
[ ";" "," "." ":"          ] @punctuation.delimiter
