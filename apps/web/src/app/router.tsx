import { useEffect } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { applyRealtimeEvent, refreshConversations, type RealtimeEvent } from '@/entities/conversation';
import { AuthCallbackPage, LoginPage, SignupPage, SocialSignupPage } from '@/pages/auth';
import { BlocksPage } from '@/pages/blocks';
import { DmListPage } from '@/pages/dm-list';
import { DmRoomPage } from '@/pages/dm-room';
import { FeedPage } from '@/pages/feed';
import { PrivacyPage, TermsPage } from '@/pages/legal';
import { NotFoundPage } from '@/pages/not-found';
import { PostDetailPage } from '@/pages/post-detail';
import { PostEditPage } from '@/pages/post-edit';
import { PostWritePage } from '@/pages/post-write';
import { MyProfilePage, UserProfilePage } from '@/pages/profile';
import { ProfileEditPage } from '@/pages/profile-edit';
import { SettingsPage } from '@/pages/settings';
import { connectRealtime, hasSession } from '@/shared/api';
import { AppShell } from '@/widgets/app-shell';
import { queryClient } from './providers/AppProviders';

function RequireAuth() {
  useEffect(() => {
    if (!hasSession()) return;
    return connectRealtime({
      onEvent: (event) => applyRealtimeEvent(queryClient, event as RealtimeEvent),
      onReconnect: () => void refreshConversations(queryClient),
    });
  }, []);
  if (!hasSession()) return <Navigate to="/login" replace />;
  return <AppShell />;
}

function GuestOnly() {
  return hasSession() ? <Navigate to="/" replace /> : <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/signup/social', element: <SocialSignupPage /> },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
    ],
  },
  { path: '/terms', element: <TermsPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/', element: <FeedPage /> },
      { path: '/posts/new', element: <PostWritePage /> },
      { path: '/posts/:id', element: <PostDetailPage /> },
      { path: '/posts/:id/edit', element: <PostEditPage /> },
      { path: '/users/:id', element: <UserProfilePage /> },
      { path: '/me', element: <MyProfilePage /> },
      { path: '/me/edit', element: <ProfileEditPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/settings/blocks', element: <BlocksPage /> },
      { path: '/dm', element: <DmListPage /> },
      { path: '/dm/:id', element: <DmRoomPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
