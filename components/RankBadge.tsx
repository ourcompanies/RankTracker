
import React from 'react';
import { PageRank } from '../types';
import { COLORS } from '../constants';

interface Props {
  page: PageRank;
  size?: 'sm' | 'md' | 'lg';
}

export const RankBadge: React.FC<Props> = ({ page, size = 'md' }) => {
  const config = {
    1: { color: COLORS.P1, icon: '✅', label: 'Pág 1' },
    2: { color: COLORS.P2, icon: '🟡', label: 'Pág 2' },
    3: { color: COLORS.P3, icon: '🟠', label: 'Pág 3' },
    4: { color: COLORS.P4, icon: '🔴', label: 'Pág 4+' },
  };

  const { color, icon, label } = config[page];
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-4 py-2 font-bold',
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} text-white`}
      style={{ backgroundColor: color }}
    >
      <span className="mr-1.5">{icon}</span>
      {label}
    </span>
  );
};
