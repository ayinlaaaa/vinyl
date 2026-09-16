import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, validatePassword, validateEmail, normalizeEmail } from "../auth/password";

describe("password hashing", () => {
  it("verifies the correct password and rejects a wrong one", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(stored).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
    expect(await verifyPassword("correct horse batterx", stored)).toBe(false);
  }, 20_000);

  it("uses a fresh salt every time", async () => {
    const a = await hashPassword("same password!");
    const b = await hashPassword("same password!");
    expect(a).not.toBe(b);
  }, 20_000);

  it("rejects malformed stored values without throwing", async () => {
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
});

describe("validation", () => {
  it("enforces password length", () => {
    expect(validatePassword("short")).toMatch(/at least/);
    expect(validatePassword("long enough password")).toBeNull();
  });
  it("checks email shape and normalises case", () => {
    expect(validateEmail("nope")).not.toBeNull();
    expect(validateEmail("a@b.co")).toBeNull();
    expect(normalizeEmail("  Person@Example.COM ")).toBe("person@example.com");
  });
});
