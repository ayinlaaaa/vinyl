import { describe, expect, it } from "vitest";
import { HANDLE_MAX, normalizeHandle, RESERVED_HANDLES, validateHandle } from "../handle";

describe("normalizeHandle", () => {
  it("trims and lowercases", () => {
    expect(normalizeHandle("  Ayinla-AAA  ")).toBe("ayinla-aaa");
  });
});

describe("validateHandle", () => {
  it("accepts simple handles", () => {
    expect(validateHandle("ada")).toBeNull();
    expect(validateHandle("night-owl")).toBeNull();
    expect(validateHandle("user2")).toBeNull();
  });

  it("rejects too short or too long", () => {
    expect(validateHandle("ab")).toMatch(/3–24/);
    expect(validateHandle("a".repeat(HANDLE_MAX + 1))).toMatch(/3–24/);
  });

  it("rejects hyphens at the ends, doubles, and other characters", () => {
    expect(validateHandle("-ada")).not.toBeNull();
    expect(validateHandle("ada-")).not.toBeNull();
    expect(validateHandle("ada--owl")).not.toBeNull();
    expect(validateHandle("Ada Owl")).not.toBeNull();
    expect(validateHandle("ada_owl")).not.toBeNull();
  });

  it("rejects reserved product words", () => {
    expect(validateHandle("dashboard")).toMatch(/reserved/);
    expect(validateHandle("Vinyl")).toMatch(/reserved/);
    expect(RESERVED_HANDLES.has("recap")).toBe(true);
  });
});
