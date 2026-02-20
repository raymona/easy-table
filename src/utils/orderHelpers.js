export const COURSE_ORDER = { '': 0, Drinks: 1, Apps: 2, Mains: 3, Dessert: 4 };

/**
 * Group an array of items by their course field,
 * sorted in course order (Drinks → Apps → Mains → Dessert, uncategorised first).
 * Returns an array of [course, items[]] pairs.
 */
export const groupItemsByCourse = (items) => {
  const groups = {};
  items.forEach((item) => {
    const course = item.course || '';
    if (!groups[course]) groups[course] = [];
    groups[course].push(item);
  });
  return Object.entries(groups).sort(
    (a, b) => (COURSE_ORDER[a[0]] ?? 99) - (COURSE_ORDER[b[0]] ?? 99)
  );
};

/**
 * Sort items by course order. Returns a new sorted array.
 */
export const sortItemsByCourse = (items) =>
  [...items].sort(
    (a, b) => (COURSE_ORDER[a.course || ''] ?? 99) - (COURSE_ORDER[b.course || ''] ?? 99)
  );
