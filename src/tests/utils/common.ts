export const parsePrice = (s?: string) => {
    if (!s) return null;
    const num = Number(s.replace(/,/g, '').trim());
    return Number.isFinite(num) ? num : null;
};