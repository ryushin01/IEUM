/** sprout의 관심사 목록입니다. API의 INTERESTS와 값을 맞춥니다. */
export const INTERESTS = [
  { value: 'game', label: '게임' }, { value: 'movie', label: '영화' }, { value: 'restaurant', label: '맛집' },
  { value: 'music', label: '음악' }, { value: 'mbti', label: 'MBTI' }, { value: 'celebrity', label: '연예인' },
  { value: 'date', label: '연애' }, { value: 'job', label: '취업' }, { value: 'alcohol', label: '술' },
  { value: 'car', label: '자동차' }, { value: 'fashion', label: '패션' }, { value: 'interior', label: '인테리어' },
  { value: 'festival', label: '페스티벌' }, { value: 'device', label: '전자기기' }, { value: 'baby', label: '육아' },
  { value: 'beauty', label: '뷰티' }, { value: 'tip', label: '꿀팁' }, { value: 'cooking', label: '요리' },
  { value: 'camping', label: '캠핑' }, { value: 'trip', label: '여행' },
] as const;

export const MAX_INTERESTS = 3;
export const interestLabel = (value: string) => INTERESTS.find((i) => i.value === value)?.label ?? value;
