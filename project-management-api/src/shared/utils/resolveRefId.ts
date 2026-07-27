/**
 * Normalize a Mongoose ref that may be either an ObjectId/string
 * or a populated document `{ _id, ... }` into a plain id string.
 *
 * Calling `.toString()` on a populated document returns a non-ObjectId
 * string like "{ _id: new ObjectId('...'), name: '...' }", which breaks queries.
 *
 * Note: BSON ObjectId exposes `_id` that returns itself — never recurse into that.
 */
export function resolveRefId(ref: unknown): string {
  if (ref == null) {
    throw new Error('Missing document reference id.');
  }

  if (typeof ref === 'string') {
    if (ref.startsWith('{') || ref.includes('ObjectId')) {
      const match = ref.match(/[a-fA-F0-9]{24}/);
      if (match) return match[0];
    }
    return ref;
  }

  if (typeof ref === 'object') {
    const anyRef = ref as {
      _bsontype?: string;
      toHexString?: () => string;
      _id?: unknown;
      id?: unknown;
      toString?: () => string;
    };

    // Native / mongoose ObjectId — do not recurse via `_id`
    if (
      anyRef._bsontype === 'ObjectId' ||
      typeof anyRef.toHexString === 'function'
    ) {
      return typeof anyRef.toHexString === 'function'
        ? anyRef.toHexString()
        : String(ref);
    }

    // Populated document: prefer nested _id when it is a different value
    if (anyRef._id != null && anyRef._id !== ref) {
      return resolveRefId(anyRef._id);
    }

    if (typeof anyRef.id === 'string' && /^[a-fA-F0-9]{24}$/.test(anyRef.id)) {
      return anyRef.id;
    }

    if (typeof anyRef.toString === 'function') {
      const asString = anyRef.toString();
      if (/^[a-fA-F0-9]{24}$/.test(asString)) return asString;
      // Populated doc toString() — extract first ObjectId hex
      if (asString.includes('ObjectId') || asString.startsWith('{')) {
        const match = asString.match(/[a-fA-F0-9]{24}/);
        if (match) return match[0];
      }
    }
  }

  return String(ref);
}

export default resolveRefId;
