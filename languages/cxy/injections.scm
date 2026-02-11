; C code injection in inline assembly
((asm_block
   (string_literal) @injection.content)
 (#set! injection.language "c"))

; C header imports
((import_declaration
   (string_literal) @injection.content)
 (#match? @injection.content "^\".*\\.h\"$")
 (#set! injection.language "c"))

; SQL injection in string literals (common pattern)
((call_expression
   function: (identifier) @_func
   arguments: (argument_list (string_literal) @injection.content))
 (#match? @_func "^(query|execute|exec)$")
 (#set! injection.language "sql"))

; JSON injection in string literals
((call_expression
   function: (field_expression
     field: (identifier) @_method)
   arguments: (argument_list (string_literal) @injection.content))
 (#match? @_method "^(parse|stringify)$")
 (#set! injection.language "json"))

; Regex injection in string literals
((call_expression
   function: (identifier) @_func
   arguments: (argument_list (string_literal) @injection.content))
 (#match? @_func "^(match|replace|search|regex)$")
 (#set! injection.language "regex"))

; HTML injection in string literals
((variable_declaration
   name: (identifier) @_var
   value: (string_literal) @injection.content)
 (#match? @_var ".*[Hh]tml.*")
 (#set! injection.language "html"))

; CSS injection in string literals
((variable_declaration
   name: (identifier) @_var
   value: (string_literal) @injection.content)
 (#match? @_var ".*[Cc]ss.*")
 (#set! injection.language "css"))

; JavaScript injection in string literals
((variable_declaration
   name: (identifier) @_var
   value: (string_literal) @injection.content)
 (#match? @_var ".*[Jj]s.*")
 (#set! injection.language "javascript"))
