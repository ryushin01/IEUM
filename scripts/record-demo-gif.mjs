#!/usr/bin/env node
/**
 * README의 시연 GIF와 화면 사진을 만듭니다. 통합 테스트를 실행하는 동안 Android 화면을 캡처합니다.
 * 준비: Android 에뮬레이터 실행. 여러 대면 ANDROID_SERIAL로 고릅니다. 데모 웹 서버는 이 스크립트가 띄웁니다.
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
const CAPTURE_INTERVAL_MS = 200;
const MAX_FRAMES = 150;
const START_AT = 'login';
const STOP_AT = 'feed-light';
/** README 화면 표에 넣는 사진입니다. 통합 테스트의 SHOT 이름과 같습니다. */
const STILLS = new Set(['login', 'feed', 'post-detail', 'post-write', 'dm-room', 'profile', 'feed-light', 'admin-reports']);
const STILL_WIDTH = 540;
const STILL_DELAY_MS = 1500;
const WEB_URL = 'http://localhost:5173/';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 앱 데이터를 지우므로 에뮬레이터만 씁니다. 여러 대면 ANDROID_SERIAL로 고릅니다. */
function selectEmulator() {
  const attached = execFileSync(adb, ['devices'], { encoding: 'utf8' }).split('\n').slice(1)
    .filter((line) => line.includes('\tdevice')).map((line) => line.split('\t')[0]);
  const wanted = process.env.ANDROID_SERIAL;
  const serial = wanted ?? attached.find((id) => id.startsWith('emulator-'));
  if (!serial || !attached.includes(serial) || !serial.startsWith('emulator-')) {
    throw new Error(`실행 중인 Android 에뮬레이터가 없습니다. 연결된 기기: ${attached.join(', ') || '없음'}`);
  }
  return serial;
}

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

function screencap(serial) {
  return new Promise((resolve, reject) => {
    const child = spawn(adb, ['-s', serial, 'exec-out', 'screencap', '-p']);
    const chunks = [];
    child.stdout.on('data', (chunk) => chunks.push(chunk));
    child.on('error', reject);
    child.on('close', () => resolve(Buffer.concat(chunks)));
  });
}

/** 통합 테스트가 화면을 멈춰 둔 사이에 찍습니다. */
async function saveStill(serial, name) {
  await sleep(STILL_DELAY_MS);
  const png = await screencap(serial);
  await sharp(png).resize({ width: STILL_WIDTH }).jpeg({ quality: 82 }).toFile(join(root, 'docs/images', `${name}.jpg`));
}

async function captureLoop(serial, frames, state) {
  let lastHash = '';
  while (state.capturing && frames.length < MAX_FRAMES) {
    const png = await screencap(serial);
    const { width, height } = await sharp(png).metadata();
    // 상태 표시줄 시계가 바뀌어도 같은 화면으로 보도록 위쪽을 빼고 비교합니다.
    const body = await sharp(png).extract({ left: 0, top: 100, width, height: Math.max(1, height - 100) }).raw().toBuffer();
    const hash = createHash('md5').update(body).digest('hex');
    if (hash !== lastHash) {
      lastHash = hash;
      const frame = await sharp(png).resize({ width: WIDTH }).png().toBuffer();
      if (await isPresentable(frame)) frames.push(frame);
    }
    await sleep(CAPTURE_INTERVAL_MS);
  }
}

async function startWeb() {
  const web = spawn('pnpm', ['exec', 'vite', '--port', '5173', '--strictPort'], {
    cwd: join(root, 'apps/web'),
    env: { ...process.env, VITE_DEMO_MODE: 'true' },
    stdio: 'ignore',
    detached: true,
  });
  let failed = null;
  web.on('error', (error) => { failed = error; });
  web.on('exit', (code) => { failed ??= new Error(`데모 웹 서버가 종료되었습니다 (코드 ${code}). 5173 포트를 확인해 주세요.`); });
  for (let i = 0; i < 60; i++) {
    if (failed) throw failed;
    const ready = await fetch(WEB_URL).then((res) => res.ok, () => false);
    // 시작 직후 다른 서버가 응답한 것이 아닌지 한 번 더 확인합니다.
    if (ready && !failed) return web;
    await sleep(500);
  }
  stopWeb(web);
  throw new Error('데모 웹 서버가 준비되지 않았습니다.');
}

function stopWeb(web) {
  try {
    process.kill(-web.pid);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

async function runTest(serial, frames) {
  const state = { capturing: false };
  const stills = [];
  let capture = Promise.resolve();
  const test = spawn('flutter', ['test', 'integration_test', '-d', serial, '--dart-define=DEMO_MODE=true', '--dart-define=MODE=demo'], { cwd: join(root, 'apps/mobile') });
  const closed = new Promise((resolve, reject) => {
    test.on('error', reject);
    test.on('close', resolve);
  });
  test.stderr.on('data', (chunk) => process.stderr.write(chunk));
  try {
    for await (const line of createInterface({ input: test.stdout })) {
      console.log(line);
      const still = line.match(/SHOT:([a-z-]+)/)?.[1];
      if (still && STILLS.has(still)) stills.push(saveStill(serial, still));
      if (line.includes(`SHOT:${START_AT}`) && !state.capturing && frames.length === 0) {
        state.capturing = true;
        capture = captureLoop(serial, frames, state);
      }
      if (line.includes(`SHOT:${STOP_AT}`) && state.capturing) {
        // 라이트 모드 화면이 잠시 보이게 합니다.
        await sleep(1500);
        state.capturing = false;
        await capture;
      }
    }
    await Promise.all(stills);
    return await closed;
  } finally {
    state.capturing = false;
    await capture;
  }
}

async function main() {
  const serial = selectEmulator();
  const device = (...args) => execFileSync(adb, ['-s', serial, ...args], { stdio: 'ignore' });
  // 이전 실행의 데모 데이터가 남으면 테스트 전제가 어긋납니다.
  try { device('uninstall', 'com.ryushin01.ieum'); } catch { /* 설치되어 있지 않습니다. */ }
  device('reverse', 'tcp:5173', 'tcp:5173');
  const web = await startWeb().catch((error) => {
    device('reverse', '--remove', 'tcp:5173');
    throw error;
  });
  const frames = [];
  try {
    const code = await runTest(serial, frames);
    if (code !== 0) throw new Error('통합 테스트가 실패해 GIF를 만들지 않습니다.');
    if (frames.length === 0) throw new Error('캡처한 화면이 없습니다.');
  } finally {
    stopWeb(web);
    try { device('reverse', '--remove', 'tcp:5173'); } catch { /* 기기가 이미 꺼졌습니다. */ }
  }
  const out = join(root, 'docs/images/demo.gif');
  await sharp(frames, { join: { animated: true } }).gif({ delay: FRAME_DELAY_MS, loop: 0, effort: 7, colours: 128 }).toFile(out);
  console.log(`${out}: 프레임 ${frames.length}개`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
