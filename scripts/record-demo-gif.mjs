#!/usr/bin/env node
/**
 * README의 시연 GIF를 만듭니다. 통합 테스트를 실행하는 동안 Android 화면을 캡처합니다.
 * 준비: Android 에뮬레이터 실행. 데모 웹 서버는 이 스크립트가 띄웁니다.
 * 실행: pnpm demo:gif
 */
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sharp = createRequire(join(root, 'apps/api/package.json'))('sharp');

const sdkAdb = join(homedir(), 'Library/Android/sdk/platform-tools/adb');
const adb = existsSync(sdkAdb) ? sdkAdb : 'adb';
const WIDTH = 280;
const FRAME_DELAY_MS = 350;
const START_AT = 'login';
const STOP_AT = 'feed-dark';

const run = (...args) => execFileSync(adb, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const device = run('devices').split('\n').slice(1).find((line) => line.includes('\tdevice'))?.split('\t')[0];
if (!device) {
  console.error('실행 중인 Android 기기가 없습니다.');
  process.exit(1);
}
// 이전 실행의 데모 데이터가 남으면 테스트 전제가 어긋납니다.
try { run('uninstall', 'com.ryushin01.ieum'); } catch { /* 설치되어 있지 않습니다. */ }
run('reverse', 'tcp:5173', 'tcp:5173');

const web = spawn('pnpm', ['exec', 'vite', '--port', '5173', '--strictPort'], {
  cwd: join(root, 'apps/web'),
  env: { ...process.env, VITE_DEMO_MODE: 'true' },
  stdio: 'ignore',
  detached: true,
});
await new Promise((resolve) => setTimeout(resolve, 4000));

const frames = [];
let capturing = false;
let lastHash = '';
let capture = Promise.resolve();

/** 통합 테스트가 그리는 분홍 탭 표시와, 화면 전환 중의 빈 화면을 뺍니다. */
async function isPresentable(frame) {
  const { data, info } = await sharp(frame).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let tapMark = 0;
  let paleMark = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r > 230 && g >= 140 && g <= 190 && b > 210) tapMark += 1;
    // 흰 바탕에서 옅어지는 표시입니다. 사진 속 분홍은 이보다 훨씬 적습니다.
    if (r > b - 12 && r - g >= 10 && b - g >= 6 && r > 200 && b > 190) paleMark += 1;
  }
  if (tapMark > 20 || paleMark > 100) return false;
  // 상태 표시줄과 하단 메뉴를 뺀 본문이 한 가지 색이면 빈 화면입니다.
  const top = Math.round(info.height * 0.12);
  const body = await sharp(frame).extract({ left: 0, top, width: info.width, height: Math.round(info.height * 0.7) }).stats();
  return body.channels.slice(0, 3).some((channel) => channel.stdev > 6);
}

async function captureLoop() {
  while (capturing) {
    const png = await new Promise((resolve, reject) => {
      const child = spawn(adb, ['exec-out', 'screencap', '-p']);
      const chunks = [];
      child.stdout.on('data', (chunk) => chunks.push(chunk));
      child.on('error', reject);
      child.on('close', () => resolve(Buffer.concat(chunks)));
    });
    // 상태 표시줄 시계가 바뀌어도 같은 화면으로 보도록 위쪽을 빼고 비교합니다.
    const { height } = await sharp(png).metadata();
    const body = await sharp(png).extract({ left: 0, top: 100, width: 300, height: Math.max(1, height - 100) }).raw().toBuffer();
    const hash = createHash('md5').update(body).digest('hex');
    if (hash !== lastHash) {
      lastHash = hash;
      const frame = await sharp(png).resize({ width: WIDTH }).png().toBuffer();
      if (await isPresentable(frame)) frames.push(frame);
    }
  }
}

const test = spawn('flutter', ['test', 'integration_test', '-d', device, '--dart-define=DEMO_MODE=true', '--dart-define=MODE=demo'], { cwd: join(root, 'apps/mobile') });
test.stderr.on('data', (chunk) => process.stderr.write(chunk));
const lines = createInterface({ input: test.stdout });
for await (const line of lines) {
  console.log(line);
  if (line.includes(`SHOT:${START_AT}`) && !capturing && frames.length === 0) {
    capturing = true;
    capture = captureLoop();
  }
  if (line.includes(`SHOT:${STOP_AT}`) && capturing) {
    // 다크 모드 화면이 잠시 보이게 합니다.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    capturing = false;
    await capture;
  }
}
const code = await new Promise((resolve) => (test.exitCode === null ? test.on('close', resolve) : resolve(test.exitCode)));
process.kill(-web.pid);
if (code !== 0) {
  console.error('통합 테스트가 실패해 GIF를 만들지 않습니다.');
  process.exit(code ?? 1);
}
if (frames.length === 0) {
  console.error('캡처한 화면이 없습니다.');
  process.exit(1);
}
const out = join(root, 'docs/images/demo.gif');
await sharp(frames, { join: { animated: true } }).gif({ delay: FRAME_DELAY_MS, loop: 0, effort: 7, colours: 128 }).toFile(out);
console.log(`${out}: 프레임 ${frames.length}개`);
