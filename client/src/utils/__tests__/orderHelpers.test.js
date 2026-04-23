import { describe, it, expect } from 'vitest';
import { groupItemsByCourse, sortItemsByCourse, COURSE_ORDER } from '../orderHelpers';

const mkItem = (course, name = 'Item') => ({
  course,
  name,
  id: name,
  price: 10,
  status: 'new',
});

// ─── COURSE_ORDER ─────────────────────────────────────────────────────────────

describe('COURSE_ORDER', () => {
  it('has the expected course order values', () => {
    expect(COURSE_ORDER['']).toBe(0);
    expect(COURSE_ORDER['Drinks']).toBe(1);
    expect(COURSE_ORDER['Apps']).toBe(2);
    expect(COURSE_ORDER['Mains']).toBe(3);
    expect(COURSE_ORDER['Dessert']).toBe(4);
  });
});

// ─── groupItemsByCourse ───────────────────────────────────────────────────────

describe('groupItemsByCourse', () => {
  it('groups items by course and sorts in course order', () => {
    const items = [
      mkItem('Mains', 'Steak'),
      mkItem('Drinks', 'Water'),
      mkItem('Apps', 'Wings'),
      mkItem('Dessert', 'Cake'),
      mkItem('', 'Side'),
    ];
    const result = groupItemsByCourse(items);
    expect(result.map(([course]) => course)).toEqual(['', 'Drinks', 'Apps', 'Mains', 'Dessert']);
  });

  it('returns empty array for empty input', () => {
    expect(groupItemsByCourse([])).toEqual([]);
  });

  it('groups multiple items under same course', () => {
    const items = [mkItem('Drinks', 'Beer'), mkItem('Drinks', 'Wine')];
    const result = groupItemsByCourse(items);
    expect(result).toHaveLength(1);
    expect(result[0][0]).toBe('Drinks');
    expect(result[0][1]).toHaveLength(2);
  });

  it('treats missing course property as empty string group', () => {
    const items = [{ id: 'x', name: 'Side', price: 5, status: 'new' }];
    const result = groupItemsByCourse(items);
    expect(result[0][0]).toBe('');
  });
});

// ─── sortItemsByCourse ────────────────────────────────────────────────────────

describe('sortItemsByCourse', () => {
  it('returns a sorted copy in course order', () => {
    const items = [mkItem('Mains', 'Steak'), mkItem('Drinks', 'Water'), mkItem('Apps', 'Wings')];
    const sorted = sortItemsByCourse(items);
    expect(sorted.map((i) => i.course)).toEqual(['Drinks', 'Apps', 'Mains']);
  });

  it('does not mutate the original array', () => {
    const items = [mkItem('Mains'), mkItem('Drinks')];
    sortItemsByCourse(items);
    expect(items[0].course).toBe('Mains');
  });
});
