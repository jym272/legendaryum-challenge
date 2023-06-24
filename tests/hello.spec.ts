const sum = (a: number, b: number): number => a + b;

describe('Example', () => {
  test('should return the sum of two numbers', () => {
    const result = sum(2, 3);
    expect(result).toBe(5);
  });
});
