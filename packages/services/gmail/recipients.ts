export type GmailRecipient = {
    email: string;
    name: string;
};

function emailLocalPart(email: string): string {
    return email.split("@")[0]?.toLowerCase() ?? "";
}

function queryTokens(query: string): string[] {
    return query
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((token) => token.length >= 2);
}

function parseSingleAddress(part: string): GmailRecipient | null {
    const trimmed = part.trim();
    if (!trimmed) return null;

    const angleMatch = trimmed.match(/^(.*)<([^>]+)>$/);
    if (angleMatch) {
        const name = (angleMatch[1] ?? "").trim().replace(/^"|"$/g, "");
        const email = (angleMatch[2] ?? "").trim();
        if (!email.includes("@")) return null;
        return { email, name: name || email };
    }

    const emailMatch = trimmed.match(/[\w.+-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
        const email = emailMatch[0];
        return { email, name: email };
    }

    return null;
}

export function parseAddressHeader(value: string): GmailRecipient[] {
    const results: GmailRecipient[] = [];

    for (const part of value.split(",")) {
        const parsed = parseSingleAddress(part);
        if (parsed) results.push(parsed);
    }

    return results;
}

export function matchesRecipient(recipient: GmailRecipient, query: string): boolean {
    const q = query.toLowerCase().trim();
    if (!q) return true;

    const email = recipient.email.toLowerCase();
    const name = recipient.name.toLowerCase();
    const local = emailLocalPart(email);

    if (email.includes(q) || name.includes(q)) return true;

    const nameParts = name.split(/\s+/).filter(Boolean);
    if (nameParts.some((part) => part.startsWith(q))) return true;

    const tokens = queryTokens(query);
    if (tokens.length === 0) return false;

    const haystack = `${name} ${local}`;
    return tokens.every((token) => haystack.includes(token));
}

export function rankRecipient(recipient: GmailRecipient, query: string): number {
    const q = query.toLowerCase().trim();
    const email = recipient.email.toLowerCase();
    const name = recipient.name.toLowerCase();
    const local = emailLocalPart(email);

    if (email === q) return 100;
    if (name === q) return 95;
    if (email.startsWith(q)) return 90;
    if (name.startsWith(q)) return 85;

    const firstName = name.split(/\s+/)[0] ?? "";
    if (firstName === q) return 80;
    if (firstName.startsWith(q)) return 75;
    if (email.includes(q)) return 60;
    if (name.includes(q)) return 50;

    const tokens = queryTokens(query);
    if (tokens.length > 0) {
        const haystack = `${name} ${local}`;
        const matched = tokens.filter((token) => haystack.includes(token));

        if (matched.length === tokens.length) {
            const inLocal = tokens.filter((token) => local.includes(token)).length;
            const joined = tokens.join("");
            const reversed = [...tokens].reverse().join("");
            let score = 45 + matched.length * 8 + inLocal * 6;
            if (local.includes(joined) || local.includes(reversed)) score += 15;
            return score;
        }

        if (matched.length > 0) {
            return 25 + matched.length * 5;
        }
    }

    if (local.includes(q)) return 55;

    return 0;
}

export function mergeRecipients(
    existing: Map<string, GmailRecipient>,
    recipients: GmailRecipient[],
) {
    for (const recipient of recipients) {
        const key = recipient.email.toLowerCase();
        if (!existing.has(key)) {
            existing.set(key, recipient);
        }
    }
}
