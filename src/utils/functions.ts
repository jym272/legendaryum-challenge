import crypto from 'crypto';

export const randomId = () => {
  return crypto.randomBytes(8).toString('hex');
};
