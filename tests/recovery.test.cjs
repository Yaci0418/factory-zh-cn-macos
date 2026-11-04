const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const asar = require('@electron/asar');
const root = path.resolve(__dirname, '..');

// Execute either shipped entry point without its CLI. All native commands are
// stubbed: no test can sign, launch or modify an installed application.
function load(file, io = {}, commands = () => '') {
  const filename = path.join(root, file);
  const nativeRequire = createRequire(filename);
  const module = { exports: {} };
  const sandbox = {
    module, exports: module.exports, __dirname: path.dirname(filename), __filename: filename,
    Buffer, setTimeout, clearTimeout, console: { log() {}, error() {} },
    process: { ...process, platform: 'darwin', env: {}, argv: [] },
    require(name) {
      if (name === 'fs') return { ...fs, ...io };
      if (name === 'child_process') return { execFileSync: commands, spawn() { throw new Error('Unexpected launch'); } };
      return nativeRequire(name);
    },
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
  return module.exports;
}
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return { appDir: dir, asar: path.join(dir, 'app.asar'), integrityFile: path.join(dir, 'Info.plist'),
    asarBackup: path.join(dir, 'backup', 'app.asar'), integrityBackup: path.join(dir, 'backup', 'Info.plist') };
}
function pair(p) {
  fs.writeFileSync(p.asar, 'previous patched archive');
  fs.writeFileSync(p.integrityFile, 'previous patched hash');
  fs.mkdirSync(path.dirname(p.asarBackup));
  fs.writeFileSync(p.asarBackup, 'original English archive');
  const incoming = path.join(p.appDir, 'incoming.asar');
  fs.writeFileSync(incoming, 'new archive');
  return incoming;
}
const messages = { restoring: 'restoring', restored: 'restored', alreadyEnglish: 'already English',
  integrityMismatch: 'integrity mismatch', restoreVerifyFailed: 'restore verification failed',
  noBackupRestore: 'no backup', resignFailed: (e) => `Signing failed: ${e}`, plistReadFailed: (e) => e };

for (const file of ['src/patcher.js', 'dist/patcher.cjs']) {
  test(`${file}: reject missing option values before selecting any app`, () => {
    const { parseArgs } = load(file);
    for (const args of [['install', '--yes', '--dir'], ['restore', '--dir', '--yes'], ['--dir', ' '], ['--lang'], ['--lang', '--yes'], ['--lang', 'fr'], ['install', 'restore']]) {
      assert.throws(() => parseArgs(args));
    }
    const parsed = parseArgs(['install', '--dir', '/tmp/test app.app', '--lang', 'zh', '--yes', '--no-launch']);
    assert.equal(parsed.dir, '/tmp/test app.app');
    assert.equal(parsed.lang, 'zh');
    assert.equal(parsed.launch, false);
  });
  test(`${file}: failed plist replacement restores previous patched pair`, (t) => {
    const p = fixture(t), incoming = pair(p);
    const { swapIn } = load(file, { renameSync(from, to) {
      if (to === p.integrityFile) throw new Error('injected plist rename failure');
      return fs.renameSync(from, to);
    } });
    assert.throws(() => swapIn(p, incoming, Buffer.from('new hash')), /injected plist/);
    assert.equal(fs.readFileSync(p.asar, 'utf8'), 'previous patched archive');
    assert.equal(fs.readFileSync(p.integrityFile, 'utf8'), 'previous patched hash');
    assert.equal(fs.readFileSync(p.asarBackup, 'utf8'), 'original English archive');
    assert.equal(fs.readdirSync(p.appDir).some((f) => f.includes('zh-cn-tmp')), false);
  });
  test(`${file}: successful replacement commits both files`, (t) => {
    const p = fixture(t), incoming = pair(p);
    load(file).swapIn(p, incoming, Buffer.from('new hash'));
    assert.equal(fs.readFileSync(p.asar, 'utf8'), 'new archive');
    assert.equal(fs.readFileSync(p.integrityFile, 'utf8'), 'new hash');
  });
  test(`${file}: failure before replacement leaves existing pair intact`, (t) => {
    const p = fixture(t); pair(p);
    assert.throws(() => load(file).swapIn(p, path.join(p.appDir, 'missing'), Buffer.from('new hash')));
    assert.equal(fs.readFileSync(p.asar, 'utf8'), 'previous patched archive');
    assert.equal(fs.readFileSync(p.integrityFile, 'utf8'), 'previous patched hash');
  });
  test(`${file}: failed rollback preserves external recovery snapshot`, (t) => {
    const p = fixture(t), incoming = pair(p);
    let snapshot;
    const { swapIn } = load(file, {
      mkdtempSync(prefix) { const dir = fs.mkdtempSync(prefix); snapshot = dir; return dir; },
      renameSync(from, to) { if (to === p.integrityFile) throw new Error('rename failed'); return fs.renameSync(from, to); },
      copyFileSync(from, to) { if (to === p.asar) throw new Error('rollback write denied'); return fs.copyFileSync(from, to); },
    });
    assert.throws(() => swapIn(p, incoming, Buffer.from('new hash')), /Recovery files:/);
    t.after(() => fs.rmSync(snapshot, { recursive: true, force: true }));
    assert.equal(fs.readFileSync(path.join(snapshot, 'app.asar'), 'utf8'), 'previous patched archive');
    assert.equal(fs.readFileSync(path.join(snapshot, 'integrity'), 'utf8'), 'previous patched hash');
  });
  for (const failure of ['sign', 'verify', 'delete']) {
    test(`${file}: restore can retry after ${failure} failure`, async (t) => {
      const p = fixture(t);
      const src = path.join(p.appDir, 'src'); fs.mkdirSync(src); fs.writeFileSync(path.join(src, 'index.js'), 'original');
      fs.mkdirSync(path.dirname(p.asarBackup));
      await asar.createPackage(src, p.asarBackup);
      const original = fs.readFileSync(p.asarBackup);
      const hash = crypto.createHash('sha256').update(asar.getRawHeader(p.asarBackup).headerString).digest('hex');
      const plist = JSON.stringify({ ElectronAsarIntegrity: { 'Resources/app.asar': { algorithm: 'SHA256', hash } } });
      fs.writeFileSync(p.integrityBackup, plist);
      fs.copyFileSync(p.asarBackup, p.asar); fs.writeFileSync(p.integrityFile, plist);
      let shouldFail = true, signs = 0, verifies = 0;
      const api = load(file, { rmSync(target, options) {
        if (shouldFail && failure === 'delete' && target === p.integrityBackup) throw new Error('injected delete failure');
        return fs.rmSync(target, options);
      } }, (command, args) => {
        if (command === 'pgrep') throw Object.assign(new Error('no processes'), { status: 1 });
        if (command === 'plutil') return fs.readFileSync(args.at(-1), 'utf8');
        assert.equal(command, 'codesign');
        if (args.includes('-d')) return '';
        // Backups must not remain inside the bundle when it is signed.
        assert.equal(fs.existsSync(p.asarBackup), false);
        assert.equal(fs.existsSync(p.integrityBackup), false);
        if (args.includes('--verify')) { verifies++; if (shouldFail && failure === 'verify') throw new Error('injected verify failure'); }
        else { signs++; if (shouldFail && failure === 'sign') throw new Error('injected sign failure'); }
        return '';
      });
      await assert.rejects(api.restore(p, { yes: true }, messages), /injected/);
      assert.deepEqual(fs.readFileSync(p.asarBackup), original);
      assert.equal(fs.readFileSync(p.integrityBackup, 'utf8'), plist);
      shouldFail = false;
      await api.restore(p, { yes: true }, messages);
      assert.ok(signs >= 1); assert.ok(verifies >= 1);
      assert.equal(fs.existsSync(p.asarBackup), false);
      assert.equal(fs.existsSync(p.integrityBackup), false);
      assert.deepEqual(fs.readFileSync(p.asar), original);
      assert.equal(fs.readFileSync(p.integrityFile, 'utf8'), plist);
    });
  }
}
