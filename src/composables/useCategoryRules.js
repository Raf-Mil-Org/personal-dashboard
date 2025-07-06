// composables/useCategoryRules.js
export const categoryRules = [
    { match: /ALBERT HEIJN/i, category: 'Groceries & household' },
    { match: /BOLT/i, category: 'Transport & travel' },
    { match: /Hairstudio/i, category: 'Health & Wellness' }
];

export function autoCategorize(description) {
    for (const rule of categoryRules) {
        if (rule.match.test(description)) {
            return rule.category;
        }
    }
    return 'Uncategorized';
}
