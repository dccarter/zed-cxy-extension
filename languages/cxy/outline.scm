; Package
(package_declaration
  name: (identifier) @name) @item

; Functions
(function_declaration
  name: (identifier) @name) @item

(expression_function_declaration
  name: (identifier) @name) @item

; Structs
(struct_declaration
  name: (identifier) @name) @item

; Classes
(class_declaration
  name: (identifier) @name) @item

; Enums
(enum_declaration
  name: (identifier) @name) @item

; Type aliases
(type_declaration
  name: (identifier) @name) @item

; Exceptions
(exception_declaration
  name: (identifier) @name) @item

; Modules
(module_declaration
  name: (identifier) @name) @item

; Tests
(test_declaration
  name: (string_literal) @name) @item

; Macros
(macro_declaration
  name: (identifier) @name) @item

; Top-level constants
(variable_declaration
  name: (identifier) @name) @item
