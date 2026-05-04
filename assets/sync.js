function toMs(value) {
  const ms = Date.parse(value ?? '');
  return Number.isNaN(ms) ? 0 : ms;
}

function normalizeTournament(item) {
  return {
    ...item,
    updatedAt: item.updatedAt ?? item.updated_at ?? null,
    deleted: item.deleted ?? false
  };
}

export function mergeTournamentLists(localItems = [], cloudItems = []) {
  const byId = new Map();
  const dirtyForCloud = [];

  for (const item of localItems) {
    if (!item?.id) continue;
    byId.set(item.id, {
      local: normalizeTournament(item),
      cloud: null
    });
  }

  for (const item of cloudItems) {
    if (!item?.id) continue;
    const current = byId.get(item.id) ?? { local: null, cloud: null };
    current.cloud = normalizeTournament(item);
    byId.set(item.id, current);
  }

  const merged = [];

  for (const [id, pair] of byId.entries()) {
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
  .sort((a, b) => (a.date_iso ?? '').localeCompare(b.date_iso ?? ''));

return {
  merged: visibleMerged,
  dirtyForCloud
};