import { useQuery, type QueryClient } from '@tanstack/react-query';
import { request } from '@/shared/api';

export interface Me {
  id: string;
  email: string | null;
  hasPassword: boolean;
  nickname: string;
  bio: string;
  avatarUrl: string | null;
  interests: string[];
  isOfficial: boolean;
}

export const ME_KEY = ['me'] as const;
export const useMe = () => useQuery({ queryKey: ME_KEY, queryFn: () => request<Me>('/me') });
export const setMe = (client: QueryClient, me: Me) => client.setQueryData(ME_KEY, me);
