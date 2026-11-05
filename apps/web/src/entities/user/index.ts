import { useQuery } from '@tanstack/react-query';
import { request } from '@/shared/api';

export interface PublicUser {
  id: string;
  nickname: string;
  bio: string;
  avatarUrl: string | null;
  interests: string[];
  isOfficial: boolean;
}

export interface UserProfile extends PublicUser {
  postCount: number;
  isBlocked: boolean;
}

export const userKey = (id: string) => ['user', id] as const;
export const BLOCKS_KEY = ['blocks'] as const;

export const useUser = (id: string) =>
  useQuery({ queryKey: userKey(id), queryFn: () => request<UserProfile>(`/users/${id}`) });

export const useBlockedUsers = () =>
  useQuery({ queryKey: BLOCKS_KEY, queryFn: () => request<PublicUser[]>('/me/blocks') });
