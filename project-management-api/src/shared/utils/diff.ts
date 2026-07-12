/**
 * Compute the diff between two objects.
 * Returns only the fields that changed, with their previous and new values.
 *
 * Used by the audit log system to record what changed during an update.
 *
 * @param oldObj - The original document values (before update)
 * @param newObj - The new values (after update)
 * @param fieldsToTrack - Optional whitelist of fields to compare (if omitted, compares all keys in newObj)
 * @returns { previousValues, newValues } — only contains fields that actually changed
 */
export function computeDiff(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  fieldsToTrack?: string[]
): { previousValues: Record<string, any>; newValues: Record<string, any> } {
  const previousValues: Record<string, any> = {};
  const newValues: Record<string, any> = {};

  const keysToCompare = fieldsToTrack || Object.keys(newObj);

  for (const key of keysToCompare) {
    // Skip internal mongoose/audit fields
    if (['_id', '__v', 'createdAt', 'updatedAt', 'deletedAt', 'createdBy', 'updatedBy'].includes(key)) {
      continue;
    }

    const oldValue = oldObj[key];
    const newValue = newObj[key];

    // Normalize for comparison
    const oldNormalized = normalizeValue(oldValue);
    const newNormalized = normalizeValue(newValue);

    if (!isEqual(oldNormalized, newNormalized)) {
      previousValues[key] = oldNormalized;
      newValues[key] = newNormalized;
    }
  }

  return { previousValues, newValues };
}

/**
 * Normalize a value for comparison.
 * Handles ObjectIds, Dates, undefined/null, etc.
 */
function normalizeValue(value: any): any {
  if (value === undefined || value === null) return null;

  // ObjectId → string
  if (value && typeof value === 'object' && value.toString && value._bsontype === 'ObjectId') {
    return value.toString();
  }

  // Mongoose document → plain object
  if (value && typeof value.toObject === 'function') {
    return value.toObject();
  }

  // Date → ISO string
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Array → normalize each element
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  return value;
}

/**
 * Simple deep equality check for serialized values.
 */
function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => isEqual(a[key], b[key]));
  }

  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Extract a snapshot of specific fields from a document for audit logging.
 * Useful for capturing "previousValues" before an update.
 */
export function snapshot(doc: Record<string, any>, fields: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (const field of fields) {
    result[field] = normalizeValue(doc[field]);
  }
  return result;
}
