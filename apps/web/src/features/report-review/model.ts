import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/shared/api';

export type ReportTargetType = 'post' | 'comment' | 'user' | 'message';
export type ReportAction = 'dismiss' | 'remove' | 'suspend';

export interface ReportGroup {
  targetType: ReportTargetType;
  targetId: string;
  count: number;
  reasons: string[];
  firstReportedAt: string;
  overdue: boolean;
  preview: { text: string | null; imageUrl: string | null; authorId: string | null; authorNickname: string | null } | null;
}

export interface SuspendedUser {
  id: string;
  nickname: string;
  suspendedAt: string;
}

const REPORTS_KEY = ['admin', 'reports'];
const SUSPENDED_KEY = ['admin', 'suspended'];

export const useOpenReports = () =>
  useQuery({ queryKey: REPORTS_KEY, queryFn: () => request<ReportGroup[]>('/admin/reports') });

export const useSuspendedUsers = () =>
  useQuery({ queryKey: SUSPENDED_KEY, queryFn: () => request<SuspendedUser[]>('/admin/users/suspended') });

export function useResolveReport() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: { targetType: ReportTargetType; targetId: string; action: ReportAction }) =>
      request('/admin/reports/resolve', { method: 'POST', body: data }),
    onSuccess: async () => {
      // 처리 결과가 피드와 대화 목록에도 반영되어야 합니다.
      await Promise.all(['admin', 'posts', 'post', 'comments', 'conversations'].map((key) =>
        client.invalidateQueries({ queryKey: [key] })));
    },
  });
}

export function useLiftSuspension() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => request(`/admin/users/${userId}/suspension`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin'] }),
  });
}
