import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export interface Storage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  /** 없는 파일을 지워도 오류가 아닙니다. */
  delete(key: string): Promise<void>;
}

/** 로컬 개발과 서버 1대 운영용입니다. */
export function createLocalStorage(dir: string): Storage {
  return {
    put: async (key, body) => {
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, key), body);
    },
    delete: (key) => rm(join(dir, key), { force: true }),
  };
}

export interface S3Config {
  bucket: string;
  region: string;
  /** AWS가 아닌 S3 호환 저장소(Cloudflare R2, 네이버 클라우드 등)의 주소 */
  endpoint?: string;
}

/** 인증 정보는 AWS SDK 기본 방식(AWS_ACCESS_KEY_ID 등, IAM 역할)을 따릅니다. */
export function createS3Storage({ bucket, region, endpoint }: S3Config): Storage {
  const client = new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    // S3 호환 저장소 다수가 SDK의 기본 체크섬 방식을 지원하지 않습니다.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  return {
    put: async (key, body, contentType) => {
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // 파일 이름이 임의 값이고 내용이 바뀌지 않습니다.
        CacheControl: 'public, max-age=31536000, immutable',
      }));
    },
    delete: async (key) => {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
