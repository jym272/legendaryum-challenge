import chalk from 'chalk';

export const activateLogging = () => !(process.env.NODE_ENV === 'test' || process.env.CI);

// eslint-disable-next-line no-console,@typescript-eslint/no-empty-function
export const log = activateLogging() ? console.log : () => {};

export const logServerIsRunning = (port: string) => {
  log('\x1b[32m%s\x1b[0m', `${String.fromCodePoint(0x1f680)} Server is running on port ${port}`);
};

const chalkColors = ['blueBright', 'cyanBright', 'magentaBright', 'yellowBright'];

export const colorObject = (obj: Record<never, unknown>, level = 0): string => {
  const colorIndex = level % chalkColors.length;

  return `{ ${Object.entries(obj).reduce((acc, [key, value], i, arr) => {
    let coloredValue = value;
    if (typeof value === 'object' && value !== null) {
      coloredValue = colorObject(value, level + 1);
    } else {
      coloredValue = chalk`{green ${JSON.stringify(value)}}`;
    }
    const addBold = level === 0 ? 'bold.' : '';
    acc += chalk`{${addBold}${chalkColors[colorIndex]} ${key}}: ${coloredValue}`;

    if (i < arr.length - 1) {
      acc += ', ';
    }
    return acc;
  }, '')} }`;
};
