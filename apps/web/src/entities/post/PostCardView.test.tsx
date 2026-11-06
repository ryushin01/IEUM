import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { TestProviders } from '@/shared/lib/test-providers';
import { PostCardView } from './PostCardView';

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#0b6be0"/></svg>')}`;

const post = {
  id: 'p1',
  author: { id: 'u1', nickname: '하늘빛', avatarUrl: null, isOfficial: false },
  isHot: false,
  caption: '퇴근길 하늘',
  images: [{ url: IMAGE, alt: '노을 그림' }],
  likeCount: 3,
  commentCount: 2,
  liked: false,
  createdAt: '2026-11-01T00:00:00Z',
  edited: false,
};

it('작성자, 내용, 사진, 숫자 순서로 보여 준다', () => {
  render(<TestProviders><PostCardView post={post} /></TestProviders>);
  const article = screen.getByRole('article', { name: '하늘빛 님의 게시글' });
  expect(article.textContent!.indexOf('하늘빛')).toBeLessThan(article.textContent!.indexOf('퇴근길 하늘'));
  expect(screen.getByRole('link', { name: /하늘빛/ })).toHaveAttribute('href', '/users/u1');
  expect(screen.getByText('좋아요 3개 · 댓글 2개')).toBeInTheDocument();
  const caption = screen.getByText('퇴근길 하늘');
  const image = screen.getByRole('img', { name: '노을 그림' });
  expect(caption.compareDocumentPosition(image) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it('사진 설명이 없으면 작성자와 순서로 대체한다', () => {
  render(<TestProviders><PostCardView post={{ ...post, images: [{ url: IMAGE, alt: '' }] }} /></TestProviders>);
  expect(screen.getByRole('img', { name: '하늘빛 님이 올린 1번째 사진' })).toBeInTheDocument();
});

it('공식 계정, 인기 글, 수정 여부를 알려 준다', () => {
  render(<TestProviders><PostCardView post={{ ...post, isHot: true, edited: true, author: { ...post.author, isOfficial: true } }} /></TestProviders>);
  expect(screen.getByText('공식 계정')).toBeInTheDocument();
  expect(screen.getByText(', 인기 게시글')).toBeInTheDocument();
  expect(screen.getByText(/수정됨/)).toBeInTheDocument();
});

it('메뉴, 동작, 아래 영역을 받아 그린다', () => {
  render(<TestProviders><PostCardView post={post} menu={<i>메뉴</i>} actions={<i>동작</i>} footer={<i>아래</i>} /></TestProviders>);
  for (const text of ['메뉴', '동작', '아래']) expect(screen.getByText(text)).toBeInTheDocument();
});
