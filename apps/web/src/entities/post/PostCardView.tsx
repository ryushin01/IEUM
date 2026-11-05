import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { timeAgo } from '@/shared/lib';
import { ImageCarousel, OfficialMark, srOnly, UserAvatar } from '@/shared/ui';
import type { Post } from './model';
import * as s from './PostCardView.css';

interface Props {
  post: Post;
  /** 목록에서는 내용을 세 줄로 줄입니다. */
  clamp?: boolean;
  menu?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}

export function PostCardView({ post, clamp, menu, actions, footer }: Props) {
  const images = post.images.map((image, i) => ({
    url: image.url,
    alt: image.alt || `${post.author.nickname} 님이 올린 ${i + 1}번째 사진`,
  }));
  return (
    <article className={s.card} aria-label={`${post.author.nickname} 님의 게시글`}>
      <header className={s.header}>
        <Link to={`/users/${post.author.id}`} className={s.author}>
          <UserAvatar nickname={post.author.nickname} src={post.author.avatarUrl} hot={post.isHot} />
          <span className={s.names}>
            <strong className={s.nameRow}>
              <span className={s.nickname}>{post.author.nickname}</span>
              {post.author.isOfficial && <OfficialMark />}
              {post.isHot && <span className={srOnly}>, 인기 게시글</span>}
            </strong>
            <time className={s.date} dateTime={post.createdAt}>
              {timeAgo(post.createdAt)}{post.edited ? ' · 수정됨' : ''}
            </time>
          </span>
        </Link>
        {menu}
      </header>
      <ImageCarousel images={images} />
      {actions && <div className={s.actions}>{actions}</div>}
      <p className={`${s.caption} ${clamp ? s.captionClamp : ''}`}>{post.caption}</p>
      {footer}
    </article>
  );
}
