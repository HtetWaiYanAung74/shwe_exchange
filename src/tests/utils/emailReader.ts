import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

export interface EmailReaderConfig {
    host: string; // e.g. 'imap.gmail.com'
    port: number; // 993
    user: string; // your gmail address
    pass: string; // Gmail App Password (NOT your normal password)
    mailbox?: string; // default 'INBOX'
}

export interface OtpSearchOptions {
    /** Substring/regex sender filter, e.g. 'binance' */
    fromContains?: string;
    /** Subject filter, e.g. 'Verification' */
    subjectContains?: string;
    /** Regex used to pull the code out of the body. Defaults to a 6-digit code. */
    codeRegex?: RegExp;
    /** Only consider emails received after this time (ms epoch). */
    since?: number;
    /** Total time to keep polling (ms). */
    timeoutMs?: number;
    /** Interval between polls (ms). */
    pollIntervalMs?: number;
}

export class EmailReader {
    private config: EmailReaderConfig;

    constructor(config: EmailReaderConfig) {
        this.config = { mailbox: "INBOX", ...config };
    }

    /**
     * Polls the mailbox until a matching Binance verification email arrives,
     * then extracts and returns the verification code.
     */
    async getVerificationCode(options: OtpSearchOptions = {}): Promise<string> {
        const {
            fromContains = "binance",
            subjectContains,
            codeRegex = /\b(\d{6})\b/,
            since = Date.now() - 5 * 60 * 1000, // last 5 mins by default
            timeoutMs = 90000,
            pollIntervalMs = 5000,
        } = options;

        const deadline = Date.now() + timeoutMs;

        while (Date.now() < deadline) {
            const code = await this.tryFetchCode({
                fromContains,
                subjectContains,
                codeRegex,
                since,
            });
            if (code) return code;
            await this.sleep(pollIntervalMs);
        }

        throw new Error(`No Binance verification code found within ${timeoutMs}ms`);
    }

    private async tryFetchCode(opts: {
        fromContains: string;
        subjectContains?: string;
        codeRegex: RegExp;
        since: number;
    }): Promise<string | null> {
        const client = new ImapFlow({
            host: this.config.host,
            port: this.config.port,
            secure: true,
            auth: { user: this.config.user, pass: this.config.pass },
            logger: false,
        });

        await client.connect();
        const lock = await client.getMailboxLock(this.config.mailbox!);

        try {
            // Search server-side for recent emails from Binance.
            const searchCriteria: Record<string, unknown> = {
                since: new Date(opts.since),
                from: opts.fromContains,
            };
            if (opts.subjectContains) {
                searchCriteria.subject = opts.subjectContains;
            }

            const uids = await client.search(searchCriteria, { uid: true });
            if (!uids || uids.length === 0) return null;

            // Newest emails last — iterate from the most recent.
            const sortedUids = [...uids].sort((a, b) => b - a);

            for (const uid of sortedUids) {
                const message = await client.fetchOne(
                    String(uid),
                    { source: true },
                    { uid: true }
                );
                if (!message || !message.source) continue;

                const parsed = await simpleParser(message.source);
                const haystack = `${parsed.text ?? ""}\n${parsed.html ?? ""}`;
                const match = haystack.match(opts.codeRegex);

                if (match) {
                    return match[1] ?? match[0];
                }
            }

            return null;
        } finally {
            lock.release();
            await client.logout();
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
