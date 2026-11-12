/**
 * 화면과 함께 맞춰야 하는 한도. 웹(`apps/web/src/shared/config/limits.ts`)과 앱도 같은 값을 쓰며,
 * `limits.test.ts`가 웹과 같은지 확인합니다.
 */
export const LIMITS = {
  /** 게시글 한 개에 붙이는 사진 */
  postImages: 5,
  /** 피드·프로필 글 한 쪽 */
  postPage: 10,
  /** 대화 메시지 한 쪽 */
  messagePage: 30,
} as const;
