const isSubsequence = (needle, haystack) => {
  if (!needle) return true;
  if (needle.length > haystack.length) return false;

  let needleIndex = 0;

  for (let i = 0; i < haystack.length && needleIndex < needle.length; i++) {
    if (haystack[i] === needle[needleIndex]) {
      needleIndex += 1;
    }
  }

  return needleIndex === needle.length;
};

/**
 * Matches a search query against a target string, tolerant of skipped
 * characters and word order. Each word of the query must appear (in order,
 * gaps allowed) within at least one word of the target, e.g. query
 * "iphone black" matches target "iphone smartphone black", and query "ipn"
 * matches the word "iphone".
 */
export const fuzzyMatch = (query, target) => {
  const cleanQuery = String(query || '').trim().toLowerCase();

  if (!cleanQuery) return true;

  const cleanTarget = String(target || '').trim().toLowerCase();
  if (!cleanTarget) return false;

  const queryWords = cleanQuery.split(/\s+/).filter(Boolean);
  const targetWords = cleanTarget.split(/\s+/).filter(Boolean);

  return queryWords.every((queryWord) =>
    targetWords.some((targetWord) => isSubsequence(queryWord, targetWord))
  );
};

/**
 * Convenience helper for the common "name or numeric ID" search pattern
 * used throughout the product/supplier/customer pickers in this app.
 */
export const fuzzyMatchProduct = (query, { name, customId } = {}) => {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return true;

  if (customId != null && String(customId).includes(cleanQuery)) {
    return true;
  }

  return fuzzyMatch(cleanQuery, name);
};
