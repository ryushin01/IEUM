import { useMe } from '@/entities/session';
import { ProfileForm } from '@/features/profile-edit';
import { usePageTitle } from '@/shared/lib';
import { ErrorView, LoadingView, srOnly } from '@/shared/ui';

export function ProfileEditPage() {
  usePageTitle('프로필 편집');
  const me = useMe();
  if (me.isPending) return <LoadingView />;
  if (me.isError) return <ErrorView error={me.error} onRetry={() => void me.refetch()} />;
  return (
    <>
      <h1 className={srOnly}>프로필 편집</h1>
      <ProfileForm me={me.data} />
    </>
  );
}
