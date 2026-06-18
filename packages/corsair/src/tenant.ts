import { corsair } from "./corsair";

export function withUserTenant(userId: string) {
    return corsair.withTenant(userId);
}
