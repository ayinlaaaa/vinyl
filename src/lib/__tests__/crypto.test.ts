import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { decrypt, encrypt, isEncrypted } from "../crypto";

const key = randomBytes(32);

describe("token encryption", () => {
  it("round-trips and produces different ciphertext each time", () => {
    const a = encrypt("secret-token", key);
    const b = encrypt("secret-token", key);
    expect(a).not.toBe(b);
    expect(isEncrypted(a)).toBe(true);
    expect(decrypt(a, key)).toBe("secret-token");
  });

  it("returns legacy plaintext values unchanged", () => {
    expect(decrypt("BQD-old-plain-token", key)).toBe("BQD-old-plain-token");
  });

  it("fails loudly if the ciphertext is tampered with", () => {
    const c = encrypt("secret", key);
    const parts = c.split(":");
    parts[3] = Buffer.from("tampered!").toString("base64");
    expect(() => decrypt(parts.join(":"), key)).toThrow();
  });

  it("fails with the wrong key", () => {
    expect(() => decrypt(encrypt("s", key), randomBytes(32))).toThrow();
  });
});
