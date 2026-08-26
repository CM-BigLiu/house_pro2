import { ValueTransformer } from 'typeorm';
import { decryptField, encryptField } from '../utils/crypto.util';

export const encryptedTransformer: ValueTransformer = {
  to: (value: string | null | undefined) => encryptField(value),
  from: (value: string | null | undefined) => decryptField(value),
};
