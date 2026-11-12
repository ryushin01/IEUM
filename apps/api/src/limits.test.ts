import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LIMITS as WEB_LIMITS } from '../../web/src/shared/config/limits.ts';
import { LIMITS } from './limits.ts';

test('웹과 API의 한도(사진 수, 쪽 크기)가 같습니다', () => {
  assert.deepEqual(WEB_LIMITS, LIMITS);
});
