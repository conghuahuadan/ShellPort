// This standalone file is also deployed to the public distribution repository.
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repository = 'conghuahuadan/ShellPort';
const apiRoot = `https://api.github.com/repos/${repository}`;
const releaseRoot = `https://github.com/${repository}/releases`;
const versionPattern = /^v(?:0|[1-9]\d{0,4})\.(?:0|[1-9]\d{0,4})\.(?:0|[1-9]\d{0,4})$/;
const maxPackage = 1024 ** 3;

export function distributionFiles(version) {
  return ['amd64', 'arm64'].flatMap(arch => [
    `ShellPort-${version}-macos-${arch}.dmg`, `ShellPort-${version}-macos-${arch}.zip`,
    `ShellPort-${version}-windows-${arch}-setup.exe`, `ShellPort-${version}-windows-${arch}.zip`,
  ]).sort();
}

export function validateRelease(release) {
  if (!release || release.draft !== false || release.prerelease !== false || !versionPattern.test(release.tag_name || '') ||
      !Number.isSafeInteger(release.id) || release.id <= 0 || !Number.isFinite(Date.parse(release.published_at)) ||
      typeof release.body !== 'string' || Buffer.byteLength(release.body) > 1024 * 1024 ||
      release.html_url !== `${releaseRoot}/tag/${release.tag_name}` || !Array.isArray(release.assets)) throw Error('正式版本信息无效。');
  const expected = [...distributionFiles(release.tag_name.slice(1)), 'SHA256SUMS.txt'].sort();
  if (release.assets.map(asset => asset?.name).sort().join('\n') !== expected.join('\n')) throw Error('正式版本附件集合不完整。');
  for (const asset of release.assets) {
    if (!Number.isSafeInteger(asset.id) || asset.id <= 0 || asset.state !== 'uploaded' || !Number.isSafeInteger(asset.size) || asset.size <= 0 ||
        asset.size > (asset.name === 'SHA256SUMS.txt' ? 64 * 1024 : maxPackage) ||
        asset.browser_download_url !== `${releaseRoot}/download/${release.tag_name}/${asset.name}`) throw Error('正式版本附件无效或尚未上传完成。');
  }
  return release;
}

export function buildFeed(release, checksums) {
  validateRelease(release);
  const hashes = new Map();
  for (const line of checksums.trim().split(/\r?\n/)) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    if (!match || hashes.has(match[2])) throw Error('SHA-256 清单无效或存在重复。');
    hashes.set(match[2], match[1]);
  }
  if ([...hashes.keys()].sort().join('\n') !== distributionFiles(release.tag_name.slice(1)).join('\n')) throw Error('SHA-256 清单文件集合不匹配。');
  const assets = release.assets.filter(asset => asset.name.endsWith('.zip')).map(asset => {
    const digest = `sha256:${hashes.get(asset.name)}`;
    if (asset.digest != null && asset.digest !== digest) throw Error('GitHub 与发布清单的 SHA-256 不一致。');
    return { name: asset.name, browser_download_url: asset.browser_download_url, size: asset.size, digest };
  });
  // Also cross-check installers when GitHub supplies their digest.
  for (const asset of release.assets.filter(asset => hashes.has(asset.name))) {
    if (asset.digest != null && asset.digest !== `sha256:${hashes.get(asset.name)}`) throw Error('附件 SHA-256 不一致。');
  }
  return { schemaVersion: 1, release: { tag_name: release.tag_name, draft: false, prerelease: false,
    body: release.body, published_at: release.published_at, assets } };
}

function snapshot(release) {
  return JSON.stringify([release.id, release.tag_name, release.draft, release.prerelease, release.body, release.published_at, release.updated_at,
    release.assets.map(asset => [asset.id, asset.name, asset.size, asset.state, asset.digest, asset.updated_at, asset.browser_download_url]).sort((a, b) => a[0] - b[0])]);
}

export async function generateFeed({ api, download } = {}) {
  const release = await api('/releases/latest');
  if (release === null) return { schemaVersion: 1, release: null };
  validateRelease(release);
  const checksum = release.assets.find(asset => asset.name === 'SHA256SUMS.txt');
  const text = await download(checksum.browser_download_url);
  if (Buffer.byteLength(text) !== checksum.size) throw Error('SHA-256 清单下载不完整。');
  const feed = buildFeed(release, text);
  const fresh = await api('/releases/latest');
  validateRelease(fresh);
  if (snapshot(fresh) !== snapshot(release)) throw Error('发布状态已变化，停止部署；请重新运行。');
  return feed;
}

async function readLimited(response, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw Error('更新元信息超出限制。');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function api(path) {
  if (!process.env.GH_TOKEN) throw Error('缺少工作流读取凭据。');
  const response = await fetch(apiRoot + path, { headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`,
    Accept: 'application/vnd.github+json', 'User-Agent': 'ShellPort-update-feed', 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(30_000), redirect: 'error' });
  if (response.status === 404) return null;
  if (!response.ok) throw Error(`GitHub 元信息请求失败（HTTP ${response.status}）。`);
  return JSON.parse(await readLimited(response, 2 * 1024 * 1024));
}

async function download(url) {
  // No token is sent to asset hosts. Validate every redirect before following it.
  for (let redirects = 0; redirects < 6; redirects++) {
    const parsed = new URL(url);
    const trusted = parsed.origin === 'https://github.com' ? parsed.pathname.startsWith(`/${repository}/releases/download/`) :
      ['https://release-assets.githubusercontent.com', 'https://objects.githubusercontent.com'].includes(parsed.origin);
    if (!trusted || parsed.username || parsed.password) throw Error('更新清单重定向地址无效。');
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30_000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) throw Error('更新清单重定向无效。');
      url = new URL(location, url).href;
      continue;
    }
    if (!response.ok) throw Error(`发布校验清单下载失败（HTTP ${response.status}）。`);
    return readLimited(response, 64 * 1024);
  }
  throw Error('更新清单重定向次数超限。');
}

export async function main() {
  if (process.env.GITHUB_REPOSITORY !== repository) throw Error('此部署只能在公开发布仓库运行。');
  const feed = await generateFeed({ api, download });
  const output = resolve('outputs/update-site');
  await mkdir(output, { recursive: true });
  await cp(fileURLToPath(new URL('../site/', import.meta.url)), output, { recursive: true });
  await writeFile(join(output, 'update.json'), JSON.stringify(feed) + '\n');
  await writeFile(join(output, '.nojekyll'), '');
  console.log(`已验证更新清单：${feed.release?.tag_name || '暂无公开正式版本'}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => { console.error('[ShellPort] 更新清单生成失败，保留已有部署；请检查公开版本、附件和工作流权限。'); process.exitCode = 1; });
}
