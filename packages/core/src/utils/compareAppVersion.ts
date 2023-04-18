// Type definition for a parsed app version, with non-nullable major, minor, and patch numbers,
// and an optional pre-release identifier.
type AppVersion = {
  major: number;
  minor: number;
  patch: number;
  preRelease: string | null;
};

// Utility type to extract the keys of the properties in the type T that are not nullable.
type NonNullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? never : K;
}[keyof T];

// Function to parse a version string into an AppVersion object.
// Throws an error if the version string is invalid.
function parseVersion(version: string): AppVersion {
  // Regular expression to match version strings in the format of X.Y.Z[-preRelease]
  const versionRegex = /^(\d+)\.(\d+)\.(\d+)(?:-?([a-z0-9]+))?$/i;
  const match = version.match(versionRegex);

  // If the version string doesn't match the regex, throw an error.
  if (!match) {
    throw new Error(`Invalid version string: ${version}`);
  }

  // Return the parsed version object.
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    preRelease: match[4] || null,
  };
}

// Function to compare two version strings, returning:
// - a positive value if versionA is greater than versionB,
// - a negative value if versionA is less than versionB,
// - zero if both versions are equal.
function compareAppVersions(versionA: string, versionB: string): number {
  // Parse both version strings into AppVersion objects.
  const parsedA = parseVersion(versionA);
  const parsedB = parseVersion(versionB);

  // Array of non-nullable keys for the AppVersion type.
  const nonNullableKeys: NonNullableKeys<AppVersion>[] = ['major', 'minor', 'patch'];

  // Compare the major, minor, and patch versions.
  for (const key of nonNullableKeys) {
    if (parsedA[key] > parsedB[key]) {
      return 1;
    }
    if (parsedA[key] < parsedB[key]) {
      return -1;
    }
  }

  // If both versions have no pre-release identifiers, they are considered equal.
  if (parsedA.preRelease === null && parsedB.preRelease === null) {
    return 0;
  }

  // If versionA has no pre-release identifier, it is considered greater than versionB.
  if (parsedA.preRelease === null) {
    return 1;
  }

  // If versionB has no pre-release identifier, it is considered greater than versionA.
  if (parsedB.preRelease === null) {
    return -1;
  }

  // Compare pre-release identifiers lexicographically.
  return parsedA.preRelease.localeCompare(parsedB.preRelease);
}

export default compareAppVersions;
