export type SyncChannel = "gmail" | "googlecalendar";

type TenantSyncState = Record<SyncChannel, number>;

const signals = new Map<string, TenantSyncState>();

function emptyState(): TenantSyncState {
    return { gmail: 0, googlecalendar: 0 };
}

export function bumpSyncSignal(tenantId: string, channel: SyncChannel) {
    const current = signals.get(tenantId) ?? emptyState();
    signals.set(tenantId, { ...current, [channel]: Date.now() });
}

export function getSyncSignals(tenantId: string): TenantSyncState {
    return signals.get(tenantId) ?? emptyState();
}
