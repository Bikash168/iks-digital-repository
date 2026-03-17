const plantName = 'Ageratum conyzoides';
const normalize = (v) => {
  const t = v.trim();
  return /\.(jpe?g|png|webp|gif)$/i.test(t) ? t : `${t}.jpg`;
};
const base = normalize(plantName);
console.log('base =', base);
console.log('url =', '/plants/' + encodeURIComponent(base));
