export const createPartialDone = (count: number, done: () => void) => {
  let i = 0;
  return () => {
    if (++i === count) {
      done();
    }
  };
};
