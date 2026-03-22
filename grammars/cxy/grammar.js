module.exports = grammar({
  name: "cxy",

  word: ($) => $.identifier,

  externals: ($) => [
    $._block_open,
    $._comptime_expand_open,
    $._comptime_expand_close,
  ],

  extras: ($) => [/\s/, $.line_comment, $.block_comment],

  conflicts: ($) => [
    // expression ambiguities
    [$._expression, $.struct_expression],
    [$._expression, $.tuple_expression],
    [$.call_expression, $.struct_expression],
    // lambda vs expression ambiguity
    [$._expression, $.lambda_parameter],
    [$._expression, $.lambda_expression],
    // macro parameter vs expression/lambda
    [$._expression, $.lambda_parameter, $.macro_parameter],
    // statement ambiguities
    [$.expression_statement, $.defer_statement],
    [$.expression_statement, $.raise_statement],
    [$.expression_statement, $.delete_statement],
    [$.expression_statement, $.return_statement],
    [$.expression_statement, $.variable_declaration],
    // type ambiguities
    [$._type, $.union_type],
    [$.pointer_type, $.union_type],
    [$.reference_type, $.union_type],
    [$.array_type, $.union_type],
    [$.named_type, $.union_type],
    [$.generic_type, $.union_type],
    [$.function_type, $.union_type],
    [$.error_type, $.union_type],
    [$._type, $.tuple_type],
    [$.typeinfo_expression, $.tuple_type],
    [$._type, $.named_type, $.generic_type],
    [$.pointer_type, $.optional_type],
    [$.reference_type, $.optional_type],
    [$.array_type, $.optional_type],
    [$.named_type, $.optional_type],
    [$.generic_type, $.optional_type],
    // comptime_if used as both statement and expression
    [$.comptime_if, $.expression_statement],
    [$._statement, $._expression],
    [$.comptime_if],
    // function body vs expression-body
    [$.function_declaration, $.expression_function_declaration],
    // optional `case` keyword in switch/match cases
    [$.switch_case, $._expression],
    [$.match_case, $._type],
    // if statement with single statement body vs parenthesized expression
    [$.if_statement, $.parenthesized_expression],
  ],

  supertypes: ($) => [$._expression, $._statement, $._type, $._item],

  rules: {
    source_file: ($) => repeat($._item),

    // =========================================================================
    // Top-level items
    // =========================================================================
    _item: ($) =>
      choice(
        $.module_declaration,
        $.package_declaration,
        $.import_declaration,
        $.export_declaration,
        $.attributed_declaration,
        $.type_declaration,
        $.variable_declaration,
        $.exception_declaration,
        $.macro_declaration,
        $.test_declaration,
        $.comptime_if,
        $.comptime_for,
      ),

    // Wraps an optional list of @attributes before a declaration
    attributed_declaration: ($) =>
      seq(
        repeat($.attribute_declaration),
        choice(
          $.function_declaration,
          $.expression_function_declaration,
          $.struct_declaration,
          $.class_declaration,
          $.enum_declaration,
        ),
      ),

    // =========================================================================
    // Comments
    // =========================================================================
    line_comment: ($) => token(seq("//", /.*/)),

    block_comment: ($) => token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),

    // =========================================================================
    // Module, Package & Imports
    // =========================================================================
    module_declaration: ($) => seq("module", field("name", $.identifier)),

    package_declaration: ($) => seq("package", field("name", $.identifier)),

    import_declaration: ($) =>
      choice(
        seq("import", field("path", $.string_literal)),
        seq(
          "import",
          field("path", $.string_literal),
          "as",
          field("alias", $.identifier),
        ),
        seq(
          "import",
          "{",
          field("symbols", commaSep1($.identifier)),
          "}",
          "from",
          field("path", $.string_literal),
        ),
        // import plugin "<name>" as alias
        seq(
          "import",
          "plugin",
          field("path", $.string_literal),
          "as",
          field("alias", $.identifier),
        ),
        // import test "<path>"
        seq("import", "test", field("path", $.string_literal)),
      ),

    // export { Symbol } from "./path.cxy"
    // export "./path.cxy"  (re-export whole module)
    export_declaration: ($) =>
      choice(
        seq("export", field("path", $.string_literal)),
        seq(
          "export",
          "{",
          field("symbols", commaSep1($.identifier)),
          "}",
          "from",
          field("path", $.string_literal),
        ),
      ),

    // =========================================================================
    // Attributes
    // =========================================================================
    attribute_declaration: ($) =>
      seq(
        "@",
        choice(seq("[", commaSep1($.attribute_item), "]"), $.attribute_item),
      ),

    attribute_item: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq("(", optional(commaSep($._expression)), ")")),
      ),

    // =========================================================================
    // Visibility
    // =========================================================================
    visibility_modifier: ($) => choice("pub", "extern", "native"),

    // =========================================================================
    // Function Declarations
    // =========================================================================
    function_declaration: ($) =>
      seq(
        optional($.visibility_modifier),
        optional("const"),
        optional("virtual"),
        optional("async"),
        "func",
        field("name", choice($.identifier, $.operator_name)),
        optional(field("generics", $.generic_parameters)),
        field("parameters", $.parameter_list),
        optional(seq(":", field("return_type", $._type))),
        field("body", $.block),
      ),

    // func name(...) => expr
    expression_function_declaration: ($) =>
      seq(
        optional($.visibility_modifier),
        optional("const"),
        optional("virtual"),
        optional("async"),
        "func",
        field("name", choice($.identifier, $.operator_name)),
        optional(field("generics", $.generic_parameters)),
        field("parameters", $.parameter_list),
        optional(seq(":", field("return_type", $._type))),
        "=>",
        field("body", $._expression),
      ),

    // Operator names like `==`, `+`, `init`, `deinit`, `[]`, `[]=`, etc.
    operator_name: ($) =>
      token(
        seq(
          "`",
          choice(
            "==",
            "!=",
            "<",
            ">",
            "<=",
            ">=",
            "+",
            "-",
            "*",
            "/",
            "%",
            "!!",
            "~",
            "[]",
            "[]=",
            "..",
            "()",
            "str",
            "hash",
            "deref",
            "&.",
            "init",
            "deinit",
            /[a-zA-Z_][a-zA-Z0-9_]*/,
          ),
          "`",
        ),
      ),

    parameter_list: ($) => seq("(", optional(commaSep($.parameter)), ")"),

    parameter: ($) =>
      seq(
        optional(choice("const", "var")),
        optional("..."),
        field("name", $.identifier),
        optional(seq(":", field("type", $._type))),
        optional(seq("=", field("default", $._expression))),
      ),

    // =========================================================================
    // Struct & Class Declarations
    // =========================================================================
    struct_declaration: ($) =>
      seq(
        optional($.visibility_modifier),
        "struct",
        field("name", $.identifier),
        optional(field("generics", $.generic_parameters)),
        field("body", $.struct_body),
      ),

    class_declaration: ($) =>
      seq(
        optional($.visibility_modifier),
        "class",
        field("name", $.identifier),
        optional(field("generics", $.generic_parameters)),
        optional(seq(":", field("base", $._type))),
        field("body", $.struct_body),
      ),

    struct_body: ($) => seq("{", repeat($.struct_member), "}"),

    // Within a struct/class body, attributes prefix the next declaration
    struct_member: ($) =>
      choice(
        $.attributed_struct_member,
        $.field_declaration,
        $.type_alias_member,
        $.annotation_member,
        $.comptime_if,
        $.comptime_for,
      ),

    attributed_struct_member: ($) =>
      seq(
        repeat($.attribute_declaration),
        choice($.function_declaration, $.expression_function_declaration),
      ),

    field_declaration: ($) =>
      seq(
        optional("-"),
        field("name", $.identifier),
        ":",
        optional(seq(field("bits", $.integer_literal), ":")),
        field("type", $._type),
        optional(seq("=", field("default", $._expression))),
        optional(";"),
      ),

    // type elementType = T; inside struct/class
    type_alias_member: ($) =>
      seq(
        "type",
        field("name", $.identifier),
        "=",
        field("type", $._type),
        optional(";"),
      ),

    // `noComparator = true; backtick-prefixed annotation inside struct/class
    annotation_member: ($) =>
      seq(
        token(seq("`", /[a-zA-Z_][a-zA-Z0-9_]*/)),
        "=",
        field("value", $._expression),
        optional(";"),
      ),

    // =========================================================================
    // Enum Declarations
    // =========================================================================
    enum_declaration: ($) =>
      seq(
        optional($.visibility_modifier),
        "enum",
        field("name", $.identifier),
        optional(seq(":", field("backing_type", $._type))),
        field("body", $.enum_body),
      ),

    enum_body: ($) => seq("{", commaSep($.enum_variant), optional(","), "}"),

    enum_variant: ($) =>
      seq(
        repeat($.attribute_declaration),
        field("name", $.identifier),
        optional(seq("=", field("value", $._expression))),
      ),

    // =========================================================================
    // Type Declaration
    // =========================================================================
    type_declaration: ($) =>
      seq(
        optional($.visibility_modifier),
        "type",
        field("name", $.identifier),
        optional(field("generics", $.generic_parameters)),
        "=",
        field("type", $._type),
      ),

    // =========================================================================
    // Exception Declaration
    // =========================================================================
    exception_declaration: ($) =>
      seq(
        optional($.visibility_modifier),
        "exception",
        field("name", $.identifier),
        "(",
        optional(commaSep($.parameter)),
        ")",
        choice(
          seq("=>", field("message", $._expression)),
          field("body", $.block),
        ),
      ),

    // =========================================================================
    // Variable Declaration
    // =========================================================================
    variable_declaration: ($) =>
      seq(
        choice("var", "const"),
        field("name", $.identifier),
        optional(seq(":", field("type", $._type))),
        optional(seq("=", field("value", $._expression))),
        optional(";"),
      ),

    // =========================================================================
    // Macro Declaration
    // =========================================================================
    macro_declaration: ($) =>
      seq(
        "macro",
        field("name", $.identifier),
        optional(field("parameters", $.macro_parameter_list)),
        optional("="),
        field("body", choice($.block, $._expression)),
      ),

    macro_parameter_list: ($) => seq("(", commaSep($.macro_parameter), ")"),

    macro_parameter: ($) => $.identifier,

    // =========================================================================
    // Test Declaration
    // =========================================================================
    test_declaration: ($) =>
      seq(
        "test",
        optional(field("name", $.string_literal)),
        field("body", $.block),
      ),

    // =========================================================================
    // Generic Parameters
    // =========================================================================
    generic_parameters: ($) => seq("[", commaSep1($.type_parameter), "]"),

    type_parameter: ($) =>
      seq(
        optional("..."),
        field("name", $.identifier),
        optional(seq("=", field("default", $._type))),
      ),

    generic_arguments: ($) =>
      seq("[", commaSep1(choice(seq("...", $._type), $._type)), "]"),

    // =========================================================================
    // Types
    // =========================================================================
    _type: ($) =>
      choice(
        $.primitive_type,
        $.named_type, // identifier (possibly generic)
        $.generic_type, // Ident[T, U]
        $.array_type, // [T] or [T, N]
        $.pointer_type, // ^T or ^const T
        $.reference_type, // &T or &const T
        $.optional_type, // T?
        $.union_type, // T | U
        $.tuple_type, // (T, U)
        $.function_type, // func(params) -> RetType
        $.error_type, // !T
      ),

    primitive_type: ($) =>
      choice(
        "void",
        "bool",
        "char",
        "wchar",
        "string",
        "__string",
        "i8",
        "i16",
        "i32",
        "i64",
        "u8",
        "u16",
        "u32",
        "u64",
        "f32",
        "f64",
        "auto",
      ),

    named_type: ($) => $.identifier,

    generic_type: ($) =>
      prec(
        1,
        seq(
          field("name", $.identifier),
          field("arguments", $.generic_arguments),
        ),
      ),

    array_type: ($) =>
      seq(
        "[",
        field("element", $._type),
        optional(seq(",", field("size", $._expression))),
        "]",
      ),

    pointer_type: ($) => seq("^", optional("const"), field("pointee", $._type)),

    reference_type: ($) =>
      seq("&", optional("const"), field("referenced", $._type)),

    optional_type: ($) => prec.left(2, seq(field("inner", $._type), "?")),

    union_type: ($) => prec.right(1, seq($._type, "|", $._type)),

    tuple_type: ($) => seq("(", commaSep2($._type), ")"),

    function_type: ($) =>
      seq(
        "func",
        "(",
        optional(commaSep($.function_type_param)),
        ")",
        optional(seq("->", field("return_type", $._type))),
      ),

    function_type_param: ($) => seq(optional(seq($.identifier, ":")), $._type),

    error_type: ($) => seq("!", field("inner", $._type)),

    // =========================================================================
    // Statements
    // =========================================================================
    _statement: ($) =>
      choice(
        $.variable_declaration,
        $.expression_statement,
        $.if_statement,
        $.while_statement,
        $.for_statement,
        $.match_statement,
        $.switch_statement,
        $.return_statement,
        $.raise_statement,
        $.break_statement,
        $.continue_statement,
        $.defer_statement,
        $.delete_statement,
        $.block,
        $.comptime_if, // comptime_if doubles as statement and expression
        $.comptime_for,
        $.comptime_const,
      ),

    expression_statement: ($) => seq($._expression, optional(";")),

    if_statement: ($) =>
      prec.right(
        1,
        seq(
          "if",
          choice(
            seq("(", field("condition", $._expression), ")"),
            seq(field("condition", $._expression), $._block_open),
          ),
          field("consequence", choice($.block, $._statement)),
          optional(
            seq(
              "else",
              field(
                "alternative",
                choice($.block, $.if_statement, $._statement),
              ),
            ),
          ),
        ),
      ),

    while_statement: ($) =>
      seq(
        "while",
        optional(
          choice(
            seq("(", field("condition", $._expression), ")"),
            seq(field("condition", $._expression), $._block_open),
          ),
        ),
        field("body", $.block),
      ),

    for_statement: ($) =>
      seq(
        "for",
        choice(
          // for (const x: iterable) / for (x: iterable)  — with parens
          seq(
            "(",
            optional(choice("const", "var")),
            field("variable", $.identifier),
            choice(":", "in"),
            field("iterable", $._expression),
            ")",
          ),
          // for (const x, i: iterable) / for (x, i in iterable)  — with parens
          seq(
            "(",
            optional(choice("const", "var")),
            field("value", $.identifier),
            ",",
            field("index", $.identifier),
            choice(":", "in"),
            field("iterable", $._expression),
            ")",
          ),
          // for x: iterable  /  for x in iterable  — no parens, single var
          seq(
            optional(choice("const", "var")),
            field("variable", $.identifier),
            choice(":", "in"),
            field("iterable", $._expression),
            $._block_open,
          ),
          // for x, i: iterable  /  for x, i in iterable  — no parens, two vars
          seq(
            optional(choice("const", "var")),
            field("value", $.identifier),
            ",",
            field("index", $.identifier),
            choice(":", "in"),
            field("iterable", $._expression),
            $._block_open,
          ),
        ),
        field("body", $.block),
      ),

    match_statement: ($) =>
      seq(
        "match",
        choice(
          seq("(", field("value", $._expression), ")"),
          seq(field("value", $._expression), $._block_open),
        ),
        "{",
        repeat($.match_case),
        "}",
      ),

    match_case: ($) =>
      seq(
        // `case` keyword is optional; `else` and `...` are defaults
        choice(
          seq(
            optional("case"),
            field("pattern", $._type),
            optional(seq("as", field("binding", $.identifier))),
          ),
          "else",
          "...",
        ),
        "=>",
        choice($.block, seq($._expression, optional(";"))),
      ),

    switch_statement: ($) =>
      seq(
        "switch",
        choice(
          seq("(", field("value", $._expression), ")"),
          seq(field("value", $._expression), $._block_open),
        ),
        "{",
        repeat($.switch_case),
        "}",
      ),

    switch_case: ($) =>
      seq(
        // `case` keyword is optional; `default` and `...` are catch-alls
        choice(
          seq(optional("case"), commaSep1($._expression)),
          "default",
          "...",
        ),
        "=>",
        choice($.block, seq($._expression, optional(";"))),
      ),

    return_statement: ($) =>
      prec.right(seq("return", optional($._expression), optional(";"))),

    raise_statement: ($) => seq("raise", $._expression, optional(";")),

    break_statement: ($) => seq("break", optional(";')")),

    continue_statement: ($) => seq("continue", optional(";")),

    defer_statement: ($) =>
      seq("defer", choice($._statement, seq($._expression, optional(";")))),

    delete_statement: ($) => seq("delete", $._expression, optional(";")),

    block: ($) => seq("{", repeat($._statement), "}"),

    // =========================================================================
    // Compile-time constructs
    // =========================================================================
    comptime_if: ($) =>
      prec.right(
        seq(
          choice("#if", "##if"),
          choice(
            seq("(", field("condition", $._expression), ")"),
            seq(field("condition", $._expression), $._block_open),
          ),
          field("consequence", $.block),
          optional(
            seq("else", field("alternative", choice($.block, $.comptime_if))),
          ),
        ),
      ),

    comptime_for: ($) =>
      seq(
        "#for",
        "(",
        optional(choice("const", "var")),
        field("variable", $.identifier),
        choice(":", "in"),
        field("iterable", $._expression),
        ")",
        field("body", $.block),
      ),

    comptime_const: ($) =>
      seq(
        "#const",
        field("name", $.identifier),
        "=",
        field("value", $._expression),
        optional(";"),
      ),

    // =========================================================================
    // Expressions
    // =========================================================================
    _expression: ($) =>
      choice(
        $.identifier,
        $.generic_type, // for constructor calls like HashMap[String, i32]()
        $.literal,
        $.tuple_expression,
        $.binary_expression,
        $.unary_expression,
        $.assignment_expression,
        $.call_expression,
        $.field_expression,
        $.pointer_field_expression,
        $.index_expression,
        $.pointer_index_expression,
        $.struct_expression,
        $.array_expression,
        $.parenthesized_expression,
        $.cast_expression,
        $.unsafe_cast_expression,
        $.c_cast_expression,
        $.ptrof_expression,
        $.comptime_expand,
        $.macro_invocation,
        $.lambda_expression,
        $.string_interpolation,
        $.catch_expression,
        $.range_expression,
        $.comptime_if, // comptime_if doubles as statement and expression
        $.type_introspection,
        $.launch_expression,
        $.async_expression,
        $.is_expression,
        $.typeinfo_expression,
        $.tuple_transform_expression,
        $.ternary_expression,
        $.defined_expression,
      ),

    // -------------------------------------------------------------------------
    // Literals
    // -------------------------------------------------------------------------
    literal: ($) =>
      choice(
        $.integer_literal,
        $.float_literal,
        $.string_literal,
        $.char_literal,
        $.boolean_literal,
        $.null_literal,
        $.this_literal,
        $.super_literal,
      ),

    // Typed literals: 10`i32, 3.14`f32, 'a'`char, 16`u64
    integer_literal: ($) =>
      token(
        seq(
          choice(/\d+/, /0x[0-9a-fA-F]+/, /0b[01]+/, /0o[0-7]+/),
          optional(seq("`", /[a-zA-Z_][a-zA-Z0-9_]*/)),
        ),
      ),

    float_literal: ($) =>
      token(
        seq(
          /\d+\.\d+([eE][+-]?\d+)?/,
          optional(seq("`", /[a-zA-Z_][a-zA-Z0-9_]*/)),
        ),
      ),

    string_literal: ($) =>
      choice(
        // Multiline string with triple quotes (must come first to match greedily)
        token(seq('"""', repeat(choice(/[^"]/, /"[^"]/, /""[^"]/)), '"""')),
        // Single-line string
        token(seq('"', repeat(choice(/[^"\\\n]/, /\\./)), '"')),
      ),

    char_literal: ($) =>
      token(
        seq(
          "'",
          choice(/[^'\\]/, /\\./),
          "'",
          optional(seq("`", /[a-zA-Z_][a-zA-Z0-9_]*/)),
        ),
      ),

    boolean_literal: ($) => choice("true", "false"),
    null_literal: ($) => "null",
    this_literal: ($) => "this",
    super_literal: ($) => "super",

    // -------------------------------------------------------------------------
    // Operators / compound expressions
    // -------------------------------------------------------------------------
    binary_expression: ($) =>
      choice(
        prec.left(1, seq($._expression, "||", $._expression)),
        prec.left(2, seq($._expression, "&&", $._expression)),
        prec.left(3, seq($._expression, "|", $._expression)),
        prec.left(4, seq($._expression, "^", $._expression)),
        prec.left(5, seq($._expression, "&", $._expression)),
        prec.left(6, seq($._expression, choice("==", "!="), $._expression)),
        prec.left(
          7,
          seq($._expression, choice("<", ">", "<=", ">="), $._expression),
        ),
        prec.left(8, seq($._expression, choice("<<", ">>"), $._expression)),
        prec.left(9, seq($._expression, choice("+", "-"), $._expression)),
        prec.left(10, seq($._expression, choice("*", "/", "%"), $._expression)),
      ),

    unary_expression: ($) =>
      choice(
        prec.right(12, seq("!", $._expression)),
        prec.right(12, seq("-", $._expression)),
        prec.right(12, seq("+", $._expression)),
        prec.right(12, seq("~", $._expression)),
        prec.right(12, seq("*", $._expression)), // deref
        prec.right(12, seq("&", $._expression)), // address-of
        prec.right(12, seq("++", $._expression)), // prefix ++
        prec.right(12, seq("--", $._expression)), // prefix --
        prec.left(13, seq($._expression, "++")), // postfix ++
        prec.left(13, seq($._expression, "--")), // postfix --
        prec.right(12, seq("&&", $._expression)), // move / double-ref
      ),

    assignment_expression: ($) =>
      prec.right(
        0,
        seq(
          field("left", $._expression),
          field(
            "operator",
            choice(
              "=",
              "+=",
              "-=",
              "*=",
              "/=",
              "%=",
              "&=",
              "|=",
              "^=",
              "<<=",
              ">>=",
            ),
          ),
          field("right", $._expression),
        ),
      ),

    call_expression: ($) =>
      prec.left(
        14,
        seq(
          field("function", $._expression),
          field("arguments", $.argument_list),
        ),
      ),

    argument_list: ($) => seq("(", optional(commaSep($._expression)), ")"),

    field_expression: ($) =>
      prec.left(
        14,
        seq(
          field("object", $._expression),
          ".",
          field("field", choice($.identifier, $.operator_name)),
        ),
      ),

    // &. dereference-and-access
    pointer_field_expression: ($) =>
      prec.left(
        14,
        seq(field("object", $._expression), "&.", field("field", $.identifier)),
      ),

    index_expression: ($) =>
      prec.left(
        14,
        seq(
          field("object", $._expression),
          "[",
          field("index", $._expression),
          "]",
        ),
      ),

    // ptr.[index] pointer indexing
    pointer_index_expression: ($) =>
      prec.left(
        14,
        seq(
          field("object", $._expression),
          ".[",
          field("index", $._expression),
          "]",
        ),
      ),

    struct_expression: ($) =>
      prec.dynamic(
        -1,
        seq(
          field("name", $.identifier),
          "{",
          optional(commaSep($.field_initializer)),
          "}",
        ),
      ),

    field_initializer: ($) =>
      seq(field("name", $.identifier), ":", field("value", $._expression)),

    array_expression: ($) => seq("[", optional(commaSep($._expression)), "]"),

    tuple_expression: ($) => seq("(", commaSep2($._expression), ")"),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    // expr as Type
    cast_expression: ($) =>
      prec.left(
        11,
        seq(field("expression", $._expression), "as", field("type", $._type)),
      ),

    // expr !: Type  (unsafe cast)
    unsafe_cast_expression: ($) =>
      prec.left(
        11,
        seq(field("expression", $._expression), "!:", field("type", $._type)),
      ),

    // <Type>expr  (C-style cast)
    c_cast_expression: ($) =>
      prec.right(
        12,
        seq(
          "<",
          field("type", $._type),
          ">",
          field("expression", $._expression),
        ),
      ),

    // ptrof expr
    ptrof_expression: ($) => prec.right(12, seq("ptrof", $._expression)),

    // #{expr} compile-time expansion — uses external scanner tokens for unambiguous { } pairing
    comptime_expand: ($) =>
      seq($._comptime_expand_open, $._expression, $._comptime_expand_close),

    // name!(...) or name! macro invocation
    macro_invocation: ($) =>
      prec.left(
        14,
        seq(
          field("name", choice($.identifier, $.field_expression)),
          "!",
          optional(
            choice(
              field("arguments", $.argument_list),
              seq("(", "#", $.identifier, ")"), // typeof!( #T )
              seq("(", "#", $.identifier, ",", commaSep($._expression), ")"),
            ),
          ),
        ),
      ),

    // (params): RetType => expr
    lambda_expression: ($) =>
      prec.right(
        0,
        seq(
          field("parameters", $.lambda_parameter_list),
          optional(seq(":", field("return_type", $._type))),
          "=>",
          field("body", choice($.block, $._expression)),
        ),
      ),

    lambda_parameter_list: ($) =>
      seq("(", optional(commaSep($.lambda_parameter)), ")"),

    lambda_parameter: ($) =>
      seq(
        optional(choice("const", "var")),
        field("name", $.identifier),
        optional(seq(":", field("type", $._type))),
      ),

    // f"text {expr} more"
    string_interpolation: ($) =>
      seq(
        token('f"'),
        repeat(
          choice(
            token.immediate(/[^"{\\]+/),
            token.immediate(/\\./),
            seq("{", $._expression, "}"),
          ),
        ),
        token.immediate('"'),
      ),

    // expr catch { ... } / expr catch value / expr catch discard
    catch_expression: ($) =>
      prec.left(
        0,
        seq(
          field("expression", $._expression),
          "catch",
          field("handler", choice($.block, "discard", $._expression)),
        ),
      ),

    // start..end  range
    range_expression: ($) =>
      prec.left(
        9,
        seq(field("start", $._expression), "..", field("end", $._expression)),
      ),

    // T.isClass, T.members, T.name etc.
    type_introspection: ($) =>
      prec.left(
        14,
        seq(field("type", $.identifier), ".", field("property", $.identifier)),
      ),

    // async expr (launch coroutine inline)
    async_expression: ($) => prec.right(12, seq("async", $._expression)),

    // launch method_call
    launch_expression: ($) => prec.right(12, seq("launch", $._expression)),

    // defined IDENT  (preprocessor check, used in #if/##if)
    defined_expression: ($) =>
      prec(13, seq("defined", field("name", $.identifier))),

    // cond ? then : else
    ternary_expression: ($) =>
      prec.right(
        0,
        seq(
          field("condition", $._expression),
          "?",
          field("consequence", $._expression),
          ":",
          field("alternative", $._expression),
        ),
      ),

    // expr is #Type  (type check)
    is_expression: ($) =>
      prec.left(
        11,
        seq(
          field("expression", $._expression),
          "is",
          "#",
          field("type", $._type),
        ),
      ),

    // #T, #i32, #(bool, i32), #(bool, i32, string)  — typeinfo expression
    // tuple_type already covers the (T1, T2, ...) form so _type handles both
    typeinfo_expression: ($) => prec(13, seq("#", field("type", $._type))),

    // #`T as M, i => transform(M, i), condition(M, i)?`  — tuple type transform
    tuple_transform_expression: ($) =>
      seq(
        token("#`"),
        field("source", $.identifier),
        "as",
        field("member", $.identifier),
        ",",
        field("index", $.identifier),
        "=>",
        field("transform", $._expression),
        optional(seq(",", field("condition", $._expression))),
        token.immediate("`"),
      ),

    // =========================================================================
    // Identifier
    // =========================================================================
    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});

// =========================================================================
// Helpers
// =========================================================================
function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)), optional(","));
}

function commaSep2(rule) {
  return seq(rule, ",", rule, repeat(seq(",", rule)), optional(","));
}
