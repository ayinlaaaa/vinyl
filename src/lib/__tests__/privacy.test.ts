import { describe, expect, it } from "vitest";
import { canViewProfile, canViewRecap, isProfilePreview } from "../privacy";

const recap = { userId: "owner-1", isPublic: false };

describe("canViewRecap", () => {
  it("lets anyone see a public recap", () => {
    expect(canViewRecap({ ...recap, isPublic: true }, null)).toBe(true);
    expect(canViewRecap({ ...recap, isPublic: true }, "someone-else")).toBe(true);
  });

  it("lets only the owner see a private recap", () => {
    expect(canViewRecap(recap, null)).toBe(false);
    expect(canViewRecap(recap, "someone-else")).toBe(false);
    expect(canViewRecap(recap, "owner-1")).toBe(true);
  });
});

describe("canViewProfile", () => {
  it("hides a private or handle-less profile from strangers", () => {
    expect(canViewProfile({ profilePublic: false, handle: "ada" }, "owner-1", null)).toBe(false);
    expect(canViewProfile({ profilePublic: true, handle: null }, "owner-1", null)).toBe(false);
  });

  it("shows a public handled profile to anyone, and always to the owner", () => {
    expect(canViewProfile({ profilePublic: true, handle: "ada" }, "owner-1", null)).toBe(true);
    expect(canViewProfile({ profilePublic: false, handle: "ada" }, "owner-1", "owner-1")).toBe(true);
  });
});

describe("isProfilePreview", () => {
  it("is true only for the owner of an unpublished profile", () => {
    expect(isProfilePreview({ profilePublic: false, handle: "ada" }, "owner-1", "owner-1")).toBe(true);
    expect(isProfilePreview({ profilePublic: true, handle: "ada" }, "owner-1", "owner-1")).toBe(false);
    expect(isProfilePreview({ profilePublic: false, handle: "ada" }, "owner-1", null)).toBe(false);
  });
});
