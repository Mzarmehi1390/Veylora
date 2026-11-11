import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';

const productPath = resolve('vendor/code-oss/product.json');
const branding = {
  nameShort: 'Veylora', nameLong: 'Veylora IDE', applicationName: 'veylora',
  dataFolderName: '.veylora', sharedDataFolderName: '.veylora-shared',
  win32MutexName: 'veylora', win32DirName: 'Veylora',
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
