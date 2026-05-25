import type { ReactNode } from 'react';
import { useSkin } from '../skins/useSkin';

interface Props {
  children: ReactNode;
}

export function Cabinet({ children }: Props) {
  const skin = useSkin();
  return (
    <div
      className="relative rounded-lg shadow-2xl"
      style={{
        width: 560,
        height: 460,
        background: `linear-gradient(180deg, ${skin.cabinet.fill} 0%, #2a1810 100%)`,
        border: `1px solid ${skin.cabinet.accent}`,
        transform: 'perspective(1200px) rotateX(8deg)',
        transformOrigin: 'center bottom',
      }}
    >
      {children}
    </div>
  );
}
