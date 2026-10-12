import "server-only";

export type StorageErrorCode = "MISSING_TURSO_CONFIG" | "INVALID_TURSO_CONFIG" | "DATABASE_AUTH_FAILED" | "DATABASE_UNAVAILABLE";
export class StorageError extends Error {
  constructor(public readonly code: StorageErrorCode, options?: ErrorOptions) {
    super(code, options);
    this.name = "StorageError";
  }
}
export function missingStorageVariables() {
  if (!process.env.VERCEL) return [];
  return ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN"].filter(key => !process.env[key]?.trim());
}
export function storageConfiguration() {
  const missing = missingStorageVariables();
  if (missing.length) throw new StorageError("MISSING_TURSO_CONFIG");
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (url) {
    try {
      const parsed = new URL(url);
      const protocols = process.env.VERCEL ? ["libsql:", "https:", "http:"] : ["libsql:", "https:", "http:", "file:"];
      if (!protocols.includes(parsed.protocol) || (parsed.protocol !== "file:" && !parsed.hostname)) throw new Error();
    } catch { throw new StorageError("INVALID_TURSO_CONFIG"); }
  }
  return {url, authToken};
}
export function storageFailure(error: unknown): StorageError {
  if (error instanceof StorageError) return error;
  // Inspect only to classify; never return credentials, SQL, URLs or raw exceptions.
  const message = error instanceof Error ? error.message : "";
  const code = /\b(401|403)\b|UNAUTHORIZED|AUTH_FAILED|FORBIDDEN/i.test(message) ? "DATABASE_AUTH_FAILED" : "DATABASE_UNAVAILABLE";
  return new StorageError(code, {cause: error});
}
export function unavailableMessage(locale = "uz") {
  return locale === "ru" ? "\u0417\u0430\u043a\u0430\u0437\u044b \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u043f\u043e\u0437\u0436\u0435." : locale === "en" ? "Orders are temporarily unavailable. Please try again later." : "Buyurtmalar vaqtincha qabul qilinmaydi. Keyinroq qayta urinib ko\u2018ring.";
}
