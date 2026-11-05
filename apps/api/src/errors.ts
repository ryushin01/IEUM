export class ApiError extends Error {
  statusCode: number;
  code: string;
  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const notFound = (message = '찾을 수 없습니다.') => new ApiError(404, 'not_found', message);
export const forbidden = (message = '권한이 없습니다.') => new ApiError(403, 'forbidden', message);
export const unauthorized = (message = '로그인이 필요합니다.') =>
  new ApiError(401, 'unauthorized', message);
export const badRequest = (message: string) => new ApiError(400, 'bad_request', message);
export const conflict = (message: string) => new ApiError(409, 'conflict', message);
