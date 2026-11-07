import { avatar, avatarFallback, hotInner, hotRing } from './ui.css';

interface Props {
  nickname: string;
  src?: string | null;
  size?: number;
  /** 옆에 닉네임이 함께 보이면 장식으로 처리합니다. */
  decorative?: boolean;
  /** 인기 게시글 작성자 링 */
  hot?: boolean;
}

export function UserAvatar({ hot, ...props }: Props) {
  if (!hot) return <Avatar {...props} />;
  return (
    <span className={hotRing}>
      <span className={hotInner}><Avatar {...props} /></span>
    </span>
  );
}

function Avatar({ nickname, src, size = 36, decorative = true }: Omit<Props, 'hot'>) {
  const label = decorative ? '' : `${nickname} 님의 프로필 사진`;
  if (src) return <img className={avatar} src={src} alt={label} width={size} height={size} style={{ width: size, height: size }} />;
  return (
    <span
      className={avatarFallback}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      {nickname.slice(0, 1)}
    </span>
  );
}
