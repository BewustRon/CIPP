import { useEffect, useState } from "react";

// Load the upstream CIPP standards and locally maintained custom standards.
// Custom standards override upstream standards with the same name.
let cache = null;
let pending = null;

export function ensureStandards() {
  if (cache) return Promise.resolve(cache);

  if (!pending) {
    pending = Promise.all([
      import("../data/standards.json"),
      import("../data/custom-standards.json"),
    ])
      .then(([upstreamModule, customModule]) => {
        const upstreamStandards = upstreamModule.default || upstreamModule;
        const customStandards = customModule.default || customModule;

        const customStandardNames = new Set(
          customStandards.map((standard) => standard.name),
        );

        cache = [
          ...upstreamStandards.filter(
            (standard) => !customStandardNames.has(standard.name),
          ),
          ...customStandards,
        ];

        return cache;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }

  return pending;
}

// Synchronous accessor for non-React utilities.
// Returns an empty array until the standards have been loaded.
export function getStandards() {
  return cache || [];
}

// React hook that re-renders after the standards have been loaded.
export function useStandards() {
  const [data, setData] = useState(cache || []);

  useEffect(() => {
    if (cache) {
      setData(cache);
      return;
    }

    let alive = true;

    ensureStandards()
      .then((standards) => {
        if (alive) setData(standards);
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  return data;
}

ensureStandards().catch(() => {});
