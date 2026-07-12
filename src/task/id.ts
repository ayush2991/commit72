import * as Crypto from 'expo-crypto';

/**
 * Cryptographically-strong RFC 4122 v4 UUID. TECH_DESIGN.md §7 calls for real
 * UUIDs now so a future sync/sharing layer inherits globally-unique,
 * schema-valid ids without an id migration.
 */
export function generateTaskId(): string {
  return Crypto.randomUUID();
}
