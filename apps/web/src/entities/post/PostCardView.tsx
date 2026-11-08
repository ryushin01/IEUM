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
  /** 사진을 화면 가득 채우고 글과 동작을 사진 위에 올립니다. 낭독 순서는 글, 사진, 동작입니다. */
  immersive?: boolean;
  menu?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}

export function PostCardView({ post, clamp, immersive, menu, actions, footer }: Props) {
  const images = post.images.map((image, i) => ({
    url: image.url,
    alt: image.alt || `${post.author.nickname} 님이 올린 ${i + 1}번째 사진`,
  }));
  const label = `${post.author.nickname} 님의 게시글`;
  const author = (
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
  );
  const caption = <p className={`${s.caption} ${clamp ? s.captionClamp : ''}`}>{post.caption}</p>;
  const stats = <p className={s.stats}>좋아요 {post.likeCount.toLocaleString()}개 · 댓글 {post.commentCount.toLocaleString()}개</p>;

  if (immersive) {
    return (
      <article className={s.immersive} aria-label={label}>
        {/* 사진 색과 상관없이 읽히도록 어두운 막 위의 글자는 테마와 상관없이 다크 색을 씁니다. */}
        <div className={s.overlay} data-theme="dark">
          <header className={s.header}>{author}</header>
          {caption}
          {stats}
        </div>
        <div className={s.media}><ImageCarousel images={images} fill /></div>
        <div className={s.rail} data-theme="dark">{actions}{menu}</div>
        {footer}
      </article>
    );
  }
  return (
    <article className={s.card} aria-label={label}>
      <header className={s.header}>{author}{menu}</header>
      {caption}
      <ImageCarousel images={images} />
      {stats}
      {actions && <div className={s.actions}>{actions}</div>}
      {footer}
    </article>
  );
}
