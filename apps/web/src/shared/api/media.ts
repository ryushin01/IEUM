import { BridgeError, callNative, isNativeApp } from '@/shared/bridge';
import { API_URL, IS_DEMO } from '@/shared/config';
import { ApiError, getAccessToken, refreshSession, request } from './client';

export type ImageSource = 'gallery' | 'camera';

const ACCEPT = 'image/jpeg,image/png,image/webp';

function pickBrowserFiles(maxCount: number): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPT;
    input.multiple = maxCount > 1;
    input.onchange = () => resolve(Array.from(input.files ?? []).slice(0, maxCount));
    input.oncancel = () => resolve([]);
    input.click();
  });
}

async function uploadNative(fileIds: string[]): Promise<string[]> {
  const send = () =>
    callNative('media.upload', { fileIds, accessToken: getAccessToken() ?? '', uploadUrl: `${API_URL}/uploads` });
  try {
    return (await send()).urls;
  } catch (error) {
    // 사진을 고르는 동안 토큰이 만료될 수 있으므로 한 번 재발급합니다.
    if (error instanceof BridgeError && error.code === 'unauthorized' && (await refreshSession())) {
      return (await send()).urls;
    }
    throw error;
  }
}

/** 앱에서는 네이티브 선택기와 업로드를, 브라우저에서는 파일 입력을 씁니다. 고르지 않으면 빈 배열입니다. */
export async function pickAndUploadImages(source: ImageSource, maxCount: number): Promise<string[]> {
  if (isNativeApp()) {
    const { fileIds } = await callNative('media.pick', { source, maxCount });
    if (!fileIds.length) return [];
    if (!IS_DEMO) return uploadNative(fileIds);
    // 데모에는 서버가 없으므로 앱에서 읽은 사진을 브라우저 안 목업으로 넘깁니다.
    const { dataUrls } = await callNative('media.read', { fileIds });
    const files = await Promise.all(dataUrls.map(async (url, i) => {
      const blob = await (await fetch(url)).blob();
      return new File([blob], `photo-${i}`, { type: blob.type });
    }));
    return uploadFiles(files);
  }
  return uploadFiles(await pickBrowserFiles(maxCount));
}

async function uploadFiles(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const form = new FormData();
    form.append('file', file);
    urls.push((await request<{ url: string }>('/uploads', { method: 'POST', form })).url);
  }
  return urls;
}

export function imageErrorMessage(error: unknown): string {
  if (error instanceof BridgeError || error instanceof ApiError) return error.message;
  return '이미지를 올리지 못했습니다.';
}
