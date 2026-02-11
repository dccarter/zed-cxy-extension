module.exports = grammar({
  name: 'cxy',

  extras: $ => [
    /\s/,
    $.line_comment,
    $.block_comment,
  ],

  rules: {
    source_file: $ => repeat($._item),

    _item: $ => choice(
      $.module_declaration,
      $.import_declaration,
      $.function_declaration,
      $.struct_declaration,
      $.class_declaration,
      $.enum_declaration,
      $.type_declaration,
      $.variable_declaration,
      $.exception_declaration,
      $.macro_declaration,
      $.test_declaration,
      $.attribute,
      $.preprocessor_directive,
    ),

    // Comments
    line_comment: $ => token(seq('//', /.*/)),

    block_comment: $ => token(seq(
      '/*',
      /[^*]*\*+([^/*][^*]*\*+)*/,
      '/'
    )),

    // Module and imports
    module_declaration: $ => seq(
      'module',
      field('name', $.identifier)
    ),

    import_declaration: $ => choice(
      seq('import', $.string_literal),
      seq('import', $.string_literal, 'as', $.identifier),
      seq('import', '{', commaSep($.identifier), '}', 'from', $.string_literal),
    ),

    // Function declarations
    function_declaration: $ => seq(
      optional($.visibility_modifier),
      optional('async'),
      'func',
      field('name', $.identifier),
      optional($.generic_parameters),
      field('parameters', $.parameter_list),
      optional(seq(':', field('return_type', $._type))),
      optional(seq(':', field('exception_type', $._type))),
      field('body', $.block)
    ),

    parameter_list: $ => seq(
      '(',
      optional(commaSep($.parameter)),
      ')'
    ),

    parameter: $ => seq(
      optional(choice('const', 'var')),
      field('name', $.identifier),
      ':',
      field('type', $._type),
      optional(seq('=', field('default', $._expression)))
    ),

    // Type declarations
    struct_declaration: $ => seq(
      optional($.visibility_modifier),
      'struct',
      field('name', $.identifier),
      optional($.generic_parameters),
      field('body', $.struct_body)
    ),

    struct_body: $ => seq(
      '{',
      repeat(choice(
        $.field_declaration,
        $.function_declaration,
        $.attribute,
      )),
      '}'
    ),

    field_declaration: $ => seq(
      optional('-'), // private marker
      field('name', $.identifier),
      ':',
      field('type', $._type),
      optional(seq('=', field('default', $._expression))),
      optional(';')
    ),

    class_declaration: $ => seq(
      optional($.visibility_modifier),
      'class',
      field('name', $.identifier),
      optional($.generic_parameters),
      field('body', $.struct_body)
    ),

    enum_declaration: $ => seq(
      optional($.visibility_modifier),
      'enum',
      field('name', $.identifier),
      optional(seq(':', field('backing_type', $._type))),
      field('body', $.enum_body)
    ),

    enum_body: $ => seq(
      '{',
      commaSep($.enum_variant),
      optional(','),
      '}'
    ),

    enum_variant: $ => seq(
      optional($.attribute),
      field('name', $.identifier),
      optional(seq('=', field('value', $._expression)))
    ),

    type_declaration: $ => seq(
      optional($.visibility_modifier),
      'type',
      field('name', $.identifier),
      optional($.generic_parameters),
      '=',
      field('type', $._type)
    ),

    exception_declaration: $ => seq(
      optional($.visibility_modifier),
      'exception',
      field('name', $.identifier),
      '(',
      field('parameter', $.parameter),
      ')',
      '=>',
      field('body', $._expression)
    ),

    // Variable declarations
    variable_declaration: $ => seq(
      choice('var', 'const'),
      field('name', $.identifier),
      optional(seq(':', field('type', $._type))),
      optional(seq('=', field('value', $._expression))),
      optional(';')
    ),

    // Test declarations
    test_declaration: $ => seq(
      'test',
      optional(field('name', $.string_literal)),
      field('body', $.block)
    ),

    // Macro declarations
    macro_declaration: $ => seq(
      'macro',
      field('name', $.identifier),
      optional($.parameter_list),
      '=',
      field('body', choice($.block, $._expression))
    ),

    // Attributes
    attribute: $ => seq(
      '@',
      choice(
        $.identifier,
        seq($.identifier, '(', optional(commaSep($._expression)), ')')
      )
    ),

    // Preprocessor directives
    preprocessor_directive: $ => choice(
      seq('#if', $._expression, $.block, optional(seq('#else', $.block))),
      seq('##if', $._expression, $.block, optional(seq('#else', $.block))),
      seq('#const', $.identifier, '=', $._expression),
    ),

    // Generic parameters
    generic_parameters: $ => seq(
      '[',
      commaSep($.type_parameter),
      ']'
    ),

    type_parameter: $ => seq(
      field('name', $.identifier),
      optional(seq('=', field('default', $._type)))
    ),

    // Types
    _type: $ => choice(
      $.primitive_type,
      $.type_identifier,
      $.array_type,
      $.pointer_type,
      $.reference_type,
      $.optional_type,
      $.union_type,
      $.generic_type,
      $.function_type,
    ),

    primitive_type: $ => choice(
      'void', 'bool', 'char', 'string', '__string',
      'i8', 'i16', 'i32', 'i64',
      'u8', 'u16', 'u32', 'u64',
      'f32', 'f64',
      'range', 'auto'
    ),

    type_identifier: $ => $.identifier,

    array_type: $ => seq(
      '[',
      field('element_type', $._type),
      optional(seq(',', field('size', $._expression))),
      ']'
    ),

    pointer_type: $ => seq('^', field('pointee', $._type)),

    reference_type: $ => seq('&', optional('const'), field('referenced', $._type)),

    optional_type: $ => seq(field('inner', $._type), '?'),

    union_type: $ => sep1($._type, '|'),

    generic_type: $ => seq(
      field('name', $.identifier),
      '[',
      commaSep($._type),
      ']'
    ),

    function_type: $ => seq(
      'func',
      field('parameters', $.parameter_list),
      optional(seq(':', field('return_type', $._type)))
    ),

    // Statements
    _statement: $ => choice(
      $.variable_declaration,
      $.expression_statement,
      $.if_statement,
      $.while_statement,
      $.for_statement,
      $.match_statement,
      $.switch_statement,
      $.return_statement,
      $.break_statement,
      $.continue_statement,
      $.defer_statement,
      $.block,
    ),

    expression_statement: $ => seq($._expression, optional(';')),

    if_statement: $ => seq(
      'if',
      optional('('),
      field('condition', $._expression),
      optional(')'),
      field('consequence', $.block),
      optional(seq('else', field('alternative', choice($.block, $.if_statement))))
    ),

    while_statement: $ => seq(
      'while',
      optional('('),
      field('condition', $._expression),
      optional(')'),
      field('body', $.block)
    ),

    for_statement: $ => seq(
      'for',
      optional('('),
      choice(
        seq(
          optional(choice('const', 'var')),
          field('variable', $.identifier),
          choice(':', 'in'),
          field('iterable', $._expression)
        ),
        seq(
          optional(choice('const', 'var')),
          field('value', $.identifier),
          ',',
          field('index', $.identifier),
          choice(':', 'in'),
          field('iterable', $._expression)
        )
      ),
      optional(')'),
      field('body', $.block)
    ),

    match_statement: $ => seq(
      'match',
      optional('('),
      field('value', $._expression),
      optional(')'),
      '{',
      repeat($.match_case),
      '}'
    ),

    match_case: $ => seq(
      choice('case', 'else', '...'),
      optional(seq(field('pattern', $._type), optional(seq('as', field('binding', $.identifier))))),
      '=>',
      choice(field('body', $.block), field('expression', $._expression))
    ),

    switch_statement: $ => seq(
      'switch',
      optional('('),
      field('value', $._expression),
      optional(')'),
      '{',
      repeat($.switch_case),
      '}'
    ),

    switch_case: $ => seq(
      choice('case', 'default', '...'),
      optional(commaSep($._expression)),
      '=>',
      choice(field('body', $.block), field('expression', $._expression))
    ),

    return_statement: $ => seq('return', optional($._expression), optional(';')),
    break_statement: $ => seq('break', optional(';')),
    continue_statement: $ => seq('continue', optional(';')),
    defer_statement: $ => seq('defer', $._statement),

    block: $ => seq(
      '{',
      repeat($._statement),
      '}'
    ),

    // Expressions
    _expression: $ => choice(
      $.literal,
      $.identifier,
      $.binary_expression,
      $.unary_expression,
      $.call_expression,
      $.field_expression,
      $.index_expression,
      $.struct_expression,
      $.array_expression,
      $.parenthesized_expression,
      $.cast_expression,
      $.comptime_expression,
      $.macro_invocation,
      $.string_interpolation,
    ),

    literal: $ => choice(
      $.integer_literal,
      $.float_literal,
      $.string_literal,
      $.char_literal,
      $.boolean_literal,
      'null'
    ),

    integer_literal: $ => token(choice(
      /\d+/,
      /0x[0-9a-fA-F]+/,
      /0b[01]+/,
      /0o[0-7]+/
    )),

    float_literal: $ => token(/\d+\.\d+([eE][+-]?\d+)?/),

    string_literal: $ => token(seq(
      '"',
      repeat(choice(
        /[^"\\]/,
        /\\./
      )),
      '"'
    )),

    char_literal: $ => token(seq("'", choice(/[^']/, /\\./), "'")),

    boolean_literal: $ => choice('true', 'false'),

    binary_expression: $ => choice(
      prec.left(1, seq($._expression, '||', $._expression)),
      prec.left(2, seq($._expression, '&&', $._expression)),
      prec.left(3, seq($._expression, '|', $._expression)),
      prec.left(4, seq($._expression, '^', $._expression)),
      prec.left(5, seq($._expression, '&', $._expression)),
      prec.left(6, seq($._expression, choice('==', '!='), $._expression)),
      prec.left(7, seq($._expression, choice('<', '>', '<=', '>='), $._expression)),
      prec.left(8, seq($._expression, choice('<<', '>>'), $._expression)),
      prec.left(9, seq($._expression, choice('+', '-'), $._expression)),
      prec.left(10, seq($._expression, choice('*', '/', '%'), $._expression)),
    ),

    unary_expression: $ => choice(
      prec(11, seq('!', $._expression)),
      prec(11, seq('-', $._expression)),
      prec(11, seq('+', $._expression)),
      prec(11, seq('~', $._expression)),
      prec(11, seq('*', $._expression)),
      prec(11, seq('&', $._expression)),
      prec(11, seq('++', $._expression)),
      prec(11, seq('--', $._expression)),
      prec(11, seq($._expression, '++')),
      prec(11, seq($._expression, '--')),
    ),

    call_expression: $ => seq(
      field('function', $._expression),
      field('arguments', $.argument_list)
    ),

    argument_list: $ => seq(
      '(',
      optional(commaSep($._expression)),
      ')'
    ),

    field_expression: $ => seq(
      field('object', $._expression),
      '.',
      field('field', $.identifier)
    ),

    index_expression: $ => seq(
      field('object', $._expression),
      '[',
      field('index', $._expression),
      ']'
    ),

    struct_expression: $ => seq(
      field('name', $.identifier),
      '{',
      optional(commaSep($.field_initializer)),
      '}'
    ),

    field_initializer: $ => seq(
      field('field', $.identifier),
      ':',
      field('value', $._expression)
    ),

    array_expression: $ => seq(
      '[',
      optional(commaSep($._expression)),
      ']'
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    cast_expression: $ => seq(
      field('expression', $._expression),
      'as',
      field('type', $._type)
    ),

    comptime_expression: $ => seq(
      '#',
      choice(
        seq('{', repeat($._statement), '}'),
        seq('(', $._expression, ')'),
        $._expression
      )
    ),

    macro_invocation: $ => seq(
      field('name', $.identifier),
      '!',
      optional(field('arguments', $.argument_list))
    ),

    string_interpolation: $ => seq(
      'f"',
      repeat(choice(
        /[^"{\\]/,
        /\\./,
        seq('{', $._expression, '}')
      )),
      '"'
    ),

    // Visibility modifiers
    visibility_modifier: $ => choice('pub', 'extern', 'native'),

    // Identifiers
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
  }
});

// Helper functions
function commaSep(rule) {
  return optional(seq(rule, repeat(seq(',', rule))));
}

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
