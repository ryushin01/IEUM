import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import * as s from './ui.css';

interface Props {
  images: { url: string; alt: string }[];
  /** 정사각형 대신 부모 높이를 가득 채웁니다. */
  fill?: boolean;
}

/** 기본 스크롤 스냅으로 넘기고, 키보드·스위치 사용자를 위해 이전·다음 버튼을 둡니다. */
export function ImageCarousel({ images, fill }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const go = (next: number) => {
    const el = track.current;
    el?.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    setIndex(next);
  };

  return (
    <div className={`${s.carousel} ${fill ? s.carouselFill : ''}`} role="group" aria-roledescription="이미지 모음" aria-label={`사진 ${images.length}장`}>
      {/* 스크롤 영역은 방향키로 넘길 수 있도록 초점을 받습니다. */}
      <div
        ref={track}
        className={`${s.track} ${fill ? s.trackFill : ''}`}
        tabIndex={images.length > 1 ? 0 : undefined}
        onScroll={(e) => {
          const { scrollLeft, clientWidth } = e.currentTarget;
          if (clientWidth) setIndex(Math.round(scrollLeft / clientWidth));
        }}
      >
        {images.map((image, i) => (
          <div key={image.url + i} className={s.slide}>
            <img className={s.slideImage} src={image.url} alt={image.alt} loading={i === 0 ? 'eager' : 'lazy'} />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <span className={s.carouselCounter}>{index + 1} / {images.length}</span>
          <button type="button" className={s.carouselButton} style={{ left: 8 }} aria-label="이전 사진" disabled={index === 0} onClick={() => go(index - 1)}>
            <LeftOutlined aria-hidden="true" />
          </button>
          <button type="button" className={s.carouselButton} style={{ right: 8 }} aria-label="다음 사진" disabled={index === images.length - 1} onClick={() => go(index + 1)}>
            <RightOutlined aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
