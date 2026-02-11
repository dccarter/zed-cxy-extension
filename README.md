# Cxy Language Extension for Zed

This extension provides syntax highlighting and language support for the [Cxy programming language](https://github.com/dccarter/cxy) in the Zed editor.

## Features

- **Syntax Highlighting**: Comprehensive highlighting for Cxy source files (`.cxy`)
- **Code Navigation**: Outline view with functions, structs, classes, enums, and other declarations
- **Language Support**: Support for all Cxy language features including:
  - Functions and methods
  - Structs, classes, and enums
  - Control flow statements (if, match, for, while, switch)
  - Type system (primitives, generics, unions)
  - Memory management keywords
  - Async/await and coroutines
  - Macros and compile-time programming
  - Exception handling
  - Foreign function interface
  - Testing framework
  - Attributes and annotations

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/cxy-lang/zed-cxy-extension.git
   ```

2. Link to your Zed extensions directory:
   ```bash
   mkdir -p ~/.config/zed/extensions
   ln -s $(pwd)/zed-cxy-extension ~/.config/zed/extensions/cxy
   ```

3. Restart Zed

### Via Zed Extensions (Coming Soon)

Once published to the Zed extension registry, you'll be able to install directly from Zed's extension marketplace.

## Language Features Supported

### Basic Syntax
- Variables (`var`, `const`)
- Functions (`func`, `async func`)
- Types (`struct`, `class`, `enum`, `type`)
- Modules and imports

### Advanced Features
- **Generics**: Type parameters and constraints
- **Pattern Matching**: `match` statements with type checking
- **Memory Management**: RAII, defer, unsafe blocks
- **Metaprogramming**: Compile-time expressions, macros
- **Async Programming**: Coroutines, async/await
- **Testing**: Built-in test framework
- **FFI**: C header imports and external functions

### Example Code

```cxy
module example

import { HashMap } from "stdlib/hash.cxy"
import "stdio.h" as stdio

pub struct User {
    name: String
    age: i32
    - active: bool = true  // Private field with default
}

impl User {
    func new(name: string, age: i32): User {
        return User{
            name: String(name),
            age: age
        }
    }

    func greet() {
        println(f"Hello, I'm {name} and I'm {age} years old!")
    }
}

async func fetchUser(id: u64): !User {
    var response = await httpGet(f"/api/users/{id}")
    if (!response.ok()) {
        raise NetworkError("Failed to fetch user")
    }
    return parseUser(response.body())
}

test "User creation" {
    var user = User.new("Alice", 30)
    assert!(user.name.str() == "Alice")
    assert!(user.age == 30)
}

func main() {
    var users = HashMap[u64, User]{}
    var user = fetchUser(123) catch |err| {
        println("Error: ", err)
        return
    }
    users.set(123, user)
}
```

## Contributing

Contributions are welcome! Please feel free to:

1. Report issues with syntax highlighting
2. Suggest improvements for language support
3. Submit pull requests for new features

### Development Setup

1. Fork this repository
2. Make your changes
3. Test with Cxy source files
4. Submit a pull request

## Related Projects

- [Cxy Programming Language](https://github.com/dccarter/cxy) - The main Cxy compiler and language implementation
- [Tree-sitter Cxy](https://github.com/cxy-lang/tree-sitter-cxy) - Tree-sitter grammar for Cxy (if available)

## License

This extension is licensed under the same license as the Cxy programming language.

## Acknowledgments

- Thanks to the Cxy language team for creating such an innovative programming language
- Thanks to the Zed team for providing an excellent extensible editor
- Special thanks to all contributors who help improve this extension