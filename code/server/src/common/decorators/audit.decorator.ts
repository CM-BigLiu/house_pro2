import { SetMetadata } from '@nestjs/common';

export interface AuditOptions {
  module: string;
  action: string;
  objectType?: string;
  objectIdPath?: string;
  captureBefore?: boolean;
  captureAfter?: boolean;
}

export const AUDIT_OPTIONS_KEY = 'audit';

export const Audit = (module: string, action: string, options?: Partial<Omit<AuditOptions, 'module' | 'action'>>) =>
  SetMetadata(AUDIT_OPTIONS_KEY, { module, action, ...options });
