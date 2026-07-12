/**
 * Locally-unique id generator. Not cryptographically strong — fine for v1's
 * on-device-only tasks. TECH_DESIGN.md §7 calls for UUID-shaped ids now so a
 * future sync/sharing layer doesn't need an id migration.
 */
export function generateTaskId(): string {
  const hex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}
