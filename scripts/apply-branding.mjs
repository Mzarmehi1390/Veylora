import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';

const productPath = resolve('vendor/code-oss/product.json');
const branding = {
  nameShort: 'Veylora', nameLong: 'Veylora IDE', applicationName: 'veylora',
  dataFolderName: '.veylora', sharedDataFolderName: '.veylora-shared',
  win32MutexName: 'veylora', win32DirName: 'Veylora',
  win32TunnelServiceMutex: 'veylora-tunnelservice',
  win32TunnelMutex: 'veylora-tunnel',
  win32x64AppId: '{{A1B2C3D4-E5F6-4789-ABCD-0123456789AB}',
  win32arm64AppId: '{{B2C3D4E5-F607-489A-BCDE-1234567890AB}',
  win32x64UserAppId: '{{C3D4E5F6-0718-49AB-CDEF-2345678901BC}',
  win32arm64UserAppId: '{{D4E5F607-1829-4ABC-DEF0-3456789012CD}',
  darwinProfileUUID: 'F6B2D1A0-5E43-4B8C-9D71-2A6C8E0F1357',
  darwinProfilePayloadUUID: '0A4C2E68-1B3D-4F90-A257-6C8E0D1B3F59',
  serverApplicationName: 'veylora-server',
  serverDataFolderName: '.veylora-server',
  tunnelApplicationName: 'veylora-tunnel',
  win32NameVersion: 'Veylora', win32RegValueName: 'Veylora',
  win32AppUserModelId: 'Veylora.IDE', win32ShellNameShort: 'Veylora',
  darwinBundleIdentifier: 'dev.veylora.ide',
  linuxDesktopName: 'dev.veylora.IDE', linuxIconName: 'veylora',
  urlProtocol: 'veylora',
  reportIssueUrl: 'https://github.com/Mzarmehi1390/Veylora/issues/new',
  licenseName: 'MIT',
  extensionsGallery: {
    serviceUrl: 'https://open-vsx.org/vscode/gallery',
    itemUrl: 'https://open-vsx.org/vscode/item',
    resourceUrlTemplate: 'https://open-vsx.org/vscode/unpkg/{publisher}/{name}/{version}/{path}',
    extensionUrlTemplate: 'https://open-vsx.org/vscode/gallery/{publisher}/{name}/latest'
  },
  linkProtectionTrustedDomains: ['https://open-vsx.org']
};

const product = JSON.parse(await readFile(productPath, 'utf8'));
Object.assign(product, branding);
delete product.defaultChatAgent;
const temporaryPath = productPath + '.veylora-tmp';
await writeFile(temporaryPath, JSON.stringify(product, null, 2) + '\n', 'utf8');
await rename(temporaryPath, productPath);
console.log('Applied Veylora product identity and Open VSX configuration.');
