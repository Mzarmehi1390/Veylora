# Upstream source and licensing

Veylora uses the Microsoft **Code - OSS** source repository as its application workbench through a pinned Git submodule at `vendor/code-oss`.

Microsoft states that the Code - OSS repository is available under the MIT License. The upstream license and notices remain in the submodule and must be included in source and binary distributions. See:

- https://github.com/microsoft/vscode
- https://github.com/microsoft/vscode/blob/main/LICENSE.txt
- https://code.visualstudio.com/docs/supporting/faq

Veylora does not redistribute Microsoft's branded Visual Studio Code product, Microsoft product logos, or a connection to the Microsoft Visual Studio Marketplace. The branding script changes the product identity and configures the vendor-neutral Open VSX registry.

The first-party Veylora Core extension is separately licensed under MIT; its license is in `extensions/veylora-core/LICENSE`.

This is an engineering notice, not legal advice. Before distributing binaries, preserve all upstream and dependency notices and review the licenses of every bundled extension and dependency.
