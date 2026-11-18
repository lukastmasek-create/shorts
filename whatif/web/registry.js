export const IDS = Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(2, '0'));
export const load = async id => (await import(`./episodes/ep${id}.js`)).default;
