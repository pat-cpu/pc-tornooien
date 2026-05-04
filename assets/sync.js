// assets/sync.js

function toMs(value) {
  const ms = Date.parse(value ?? "");
  return Number.isNaN(ms) ? 0 : ms;
}

function normalizeTournament(item) {
  return {
    ...item,
    id: String(item?.id ?? ""),
    updatedAt: item?.updatedAt ?? item?.updated_at ?? null,
    updated_at: item?.updated_at ?? item?.updatedAt ?? null,
    deleted: Boolean(item?.deleted)
  };
}

export function mergeTournamentLists(localItems = [], cloudItems = []) {
  const byId = new Map();
  const dirtyForCloud = [];

  for (const item of localItems) {
    const normalized = normalizeTournament(item);
    if (!normalized.id) continue;

    byId.set(normalized.id, {
      local: normalized,
      cloud: null
    });
  }

  for (const item of cloudItems) {
    const normalized = normalizeTournament(item);
    if (!normalized.id) continue;

    const current = byId.get(normalized.id) ?? {
      local: null,
      cloud: null
    };

    current.cloud = normalized;
    byId.set(normalized.id, current);
  }

  const merged = [];

  for (const [, pair] of byId.entries()) {
    const local = pair.local;
    const cloud = pair.cloud;

    if (local && !cloud) {
      merged.push(local);
      dirtyForCloud.push(local);
      continue;
    }

    if (!local && cloud) {
      merged.push(cloud);
      continue;
    }

    const localMs = toMs(local.updatedAt);
    const cloudMs = toMs(cloud.updatedAt);

    if (localMs >= cloudMs) {
      merged.push(local);

      if (localMs > cloudMs) {
        dirtyForCloud.push(local);
      }
    } else {
      merged.push(cloud);
    }
  }

  const visibleMerged = merged
    .filter(item => item.deleted !== true)
    .sort((a, b) => (a.date_iso ?? "").localeCompare(b.date_iso ?? ""));

  return {
    merged: visibleMerged,
    dirtyForCloud
  };
}