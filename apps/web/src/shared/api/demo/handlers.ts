import { http } from 'msw';
import { API_URL } from '@/shared/config';
import { demoFetch } from './server';

/** 실제 요청을 목업 API(server.ts)가 읽는 모양으로 바꿉니다. 파일 업로드는 FormData 그대로 넘깁니다. */
async function readBody(request: Request): Promise<RequestInit['body']> {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;
  if (request.headers.get('content-type')?.includes('multipart/form-data')) return request.formData();
  return (await request.text()) || undefined;
}

/**
 * 웹 화면이 보낸 API 요청을 네트워크 단계에서 받아 목업 API로 처리합니다.
 * 화면과 client.ts는 실제 모드와 똑같이 fetch를 호출합니다.
 */
export const handlers = [
  http.all(`${API_URL}/*`, async ({ request }) => {
    const url = new URL(request.url);
    return demoFetch(`${url.pathname}${url.search}`, {
      method: request.method,
      headers: Object.fromEntries(request.headers),
      body: await readBody(request),
    });
  }),
];
