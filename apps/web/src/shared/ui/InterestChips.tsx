import { INTERESTS, MAX_INTERESTS } from '@/shared/config';
import * as s from './ui.css';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

/** 관심사는 최대 3개이며, 다 고르면 나머지를 비활성화해 초과 선택을 막습니다. */
export function InterestChips({ value, onChange }: Props) {
  const full = value.length >= MAX_INTERESTS;
  return (
    <fieldset className={s.chipGroup}>
      <legend className={s.chipLegend}>관심사 (최대 {MAX_INTERESTS}개, {value.length}개 선택)</legend>
      <div className={s.chips}>
        {INTERESTS.map((interest) => {
          const checked = value.includes(interest.value);
          return (
            <label key={interest.value}>
              <input
                type="checkbox"
                className={s.chipInput}
                checked={checked}
                disabled={full && !checked}
                onChange={() => onChange(checked ? value.filter((v) => v !== interest.value) : [...value, interest.value])}
              />
              <span className={s.chip}>{interest.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
