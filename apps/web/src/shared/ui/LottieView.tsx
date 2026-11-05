import { Lottie } from 'lottie-react';

/** 움직임 줄이기 설정을 켠 사용자에게는 첫 장면만 보여 줍니다. */
export default function LottieView({ data, loop = true, className }: { data: unknown; loop?: boolean; className?: string }) {
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return <Lottie className={className} src={data as object} loop={loop && !still} autoplay={!still} aria-hidden="true" />;
}
