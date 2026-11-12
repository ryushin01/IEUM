/** API(`apps/api/src/limits.ts`)와 같아야 하는 한도. API 테스트가 두 값을 비교합니다. */
export const LIMITS = {
  /** 게시글 한 개에 붙이는 사진 */
  postImages: 5,
  /** 피드·프로필 글 한 쪽 (데모 서버) */
  postPage: 10,
  /** 대화 메시지 한 쪽 (데모 서버) */
  messagePage: 30,
} as const;
