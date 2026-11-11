# Code - OSS upstream workflow

## Pinned source

The Code - OSS workbench is included as a Git submodule at `vendor/code-oss`. The repository records an exact upstream commit so builds are repeatable.

Clone Veylora with the upstream source:

```bash
git clone --recurse-submodules https://github.com/Mzarmehi1390/Veylora.git
cd Veylora
```

If the repository was cloned without submodules:

```bash
git submodule update --init --recursive
```

## Development

Requirements: Git, Node.js 22 or newer, Corepack, and the native build tools required by Code - OSS on your operating system.

```bash
./scripts/bootstrap.sh
```

Use two terminals:

```bash
npm run dev:watch
```

```bash
npm run dev:launch
```

The launch command opens the Code - OSS development workbench with Veylora Core loaded.

## Apply product identity

```bash
npm run brand
```

This updates the submodule's local `product.json` working copy. It is a build-time customization and does not alter the pinned upstream commit. Re-run it after resetting or updating the submodule.

The branding step configures Open VSX. It deliberately does not configure Microsoft's Visual Studio Marketplace.

## Updating upstream

Review the proposed upstream commit before changing the pin:

```bash
git -C vendor/code-oss fetch origin
git -C vendor/code-oss log --oneline HEAD..origin/main
git -C vendor/code-oss checkout <reviewed-commit>
git add vendor/code-oss
git commit -m "chore: update Code - OSS upstream"
```

Do not use an unreviewed floating upstream branch in release builds.
