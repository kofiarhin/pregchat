const normalizeSeed = (seed) => {
  if (seed === undefined || seed === null || seed === "") {
    return null;
  }

  const text = String(seed);
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }

  const normalized = Math.abs(hash);
  return normalized === 0 ? 1 : normalized;
};

const createSeededRandom = (seed) => {
  let value = seed % 2147483647;

  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const shuffle = (input, seed) => {
  const source = Array.isArray(input) ? [...input] : [];
  const normalizedSeed = normalizeSeed(seed);
  const randomFn = normalizedSeed ? createSeededRandom(normalizedSeed) : Math.random;

  for (let index = source.length - 1; index > 0; index -= 1) {
    const randomValue = randomFn();
    const swapIndex = Math.floor(randomValue * (index + 1));
    const temporary = source[index];
    source[index] = source[swapIndex];
    source[swapIndex] = temporary;
  }

  return source;
};

export { shuffle };
export default shuffle;
