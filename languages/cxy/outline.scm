; Function declarations
(function_declaration
  name: (identifier) @name) @item

; Struct declarations
(struct_declaration
  name: (identifier) @name) @item

; Class declarations
(class_declaration
  name: (identifier) @name) @item

; Enum declarations
(enum_declaration
  name: (identifier) @name) @item

; Type declarations
(type_declaration
  name: (identifier) @name) @item

; Exception declarations
(exception_declaration
  name: (identifier) @name) @item

; Module declarations
(module_declaration
  name: (identifier) @name) @item

; Test declarations
(test_declaration
  name: (string_literal)? @name) @item

; Macro declarations
(macro_declaration
  name: (identifier) @name) @item

; Variable declarations (only top-level const)
(variable_declaration
  "const"
  name: (identifier) @name) @item

; Method declarations within structs/classes
(struct_body
  (function_declaration
    name: (identifier) @name) @item)

; Field declarations
(field_declaration
  name: (identifier) @name) @item

; Enum variants
(enum_variant
  name: (identifier) @name) @item
