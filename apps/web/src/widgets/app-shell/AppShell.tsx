import { ArrowLeftOutlined, HomeOutlined, MessageOutlined, PlusSquareOutlined, VerticalAlignTopOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useEffect, useRef, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router';
import { useConversations } from '@/entities/conversation';
import { useMe } from '@/entities/session';
import { ThemeSwitch } from '@/features/theme-switch';
import { callNative, isNativeApp } from '@/shared/bridge';
import { Logo, srOnly, UserAvatar } from '@/shared/ui';
import * as s from './AppShell.css';

const ROOT_PATHS = ['/', '/dm', '/me'];

/** sprout 구조: 모바일은 상단 헤더와 하단 GNB, 넓은 화면은 왼쪽 레일(헤더 + GNB)입니다. */
export function AppShell() {
  const { pathname, key } = useLocation();
  const navigate = useNavigate();
  const inRoom = useMatch('/dm/:id') !== null;
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  const { data: me } = useMe();
  const unread = useConversations().data?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;

  const embedded = isNativeApp();
  useEffect(() => {
    if (embedded) void callNative('ui.setUnread', { count: unread }).catch(() => {});
  }, [embedded, unread]);

  // 화면이 바뀌면 맨 위에서 시작하고, 낭독 사용자를 위해 초점을 본문으로 옮깁니다.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    main.current?.focus({ preventScroll: true });
  }, [pathname]);

  const goBack = () => (key === 'default' ? navigate('/', { replace: true }) : navigate(-1));

  return (
    <>
      <a className={s.skip} href="#main">본문 바로가기</a>
      <header className={s.header}>
        {ROOT_PATHS.includes(pathname) ? <span /> : (
          <Button className={s.back} type="text" aria-label="뒤로 가기" icon={<ArrowLeftOutlined aria-hidden="true" />} onClick={() => void goBack()} />
        )}
        <Link to="/" className={s.brand} aria-label="IEUM 홈">
          <Logo size={26} />
        </Link>
        <ThemeSwitch className={s.theme} />
      </header>
      <main id="main" ref={main} tabIndex={-1} className={inRoom ? s.mainFull : embedded ? s.mainEmbedded : s.main}>
        <Outlet />
      </main>
      {/* 앱에서는 Flutter가 하단 메뉴를 그립니다. */}
      {!inRoom && !embedded && (
        <nav className={s.nav} aria-label="주 메뉴">
          <ul className={s.navList}>
            <NavItem to="/" label="홈" end icon={<HomeOutlined aria-hidden="true" />} />
            <NavItem
              to="/me"
              label="내 정보"
              end
              icon={me ? <span className={s.navAvatar}><UserAvatar nickname={me.nickname} src={me.avatarUrl} size={26} /></span> : <span className={s.navAvatar} />}
            />
            <NavItem to="/posts/new" label="새 게시글" icon={<PlusSquareOutlined aria-hidden="true" />} />
            <NavItem to="/dm" label="메시지" end unread={unread} icon={<MessageOutlined aria-hidden="true" />} />
            <li className={s.navItem}>
              <button type="button" className={s.navLink} aria-label="맨 위로" onClick={() => window.scrollTo({ top: 0 })}>
                <span className={s.navIcon}><VerticalAlignTopOutlined aria-hidden="true" /></span>
              </button>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}

function NavItem({ to, label, icon, end, unread = 0 }: { to: string; label: string; icon: ReactNode; end?: boolean; unread?: number }) {
  return (
    <li className={s.navItem}>
      <NavLink to={to} end={end} className={s.navLink}>
        <span className={s.navIcon}>
          {icon}
          {unread > 0 && <span className={s.badge} aria-hidden="true">{unread > 99 ? '99+' : unread}</span>}
        </span>
        <span className={srOnly}>{label}{unread > 0 ? `, 읽지 않은 메시지 ${unread}개` : ''}</span>
      </NavLink>
    </li>
  );
}
