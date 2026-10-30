import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { estimateAmount, hoursBetween, toLocalInput, money } from './index.js';
import { Badge, Empty } from '../components/ui.jsx';

describe('utils', () => {
  it('bills per started hour', () => {
    expect(hoursBetween('2030-01-01T10:00:00Z', '2030-01-01T11:01:00Z')).toBe(2);
    expect(estimateAmount('2030-01-01T10:00:00Z', '2030-01-01T12:00:00Z', 40)).toBe(80);
  });
  it('never returns a negative estimate', () => {
    expect(estimateAmount('2030-01-01T12:00:00Z', '2030-01-01T10:00:00Z', 40)).toBe(0);
  });
  it('formats datetime-local values', () => { expect(toLocalInput(new Date(2030, 0, 5, 9, 7))).toBe('2030-01-05T09:07'); });
  it('formats money in INR', () => { expect(money(1200)).toContain('1,200'); });
});

describe('components', () => {
  it('Badge shows humanised status', () => { render(<Badge value="checked_in" />); expect(screen.getByText('checked in')).toBeTruthy(); });
  it('Empty shows title and hint', () => { render(<Empty title="Nothing here" hint="Add one" />); expect(screen.getByText('Nothing here')).toBeTruthy(); expect(screen.getByText('Add one')).toBeTruthy(); });
});
