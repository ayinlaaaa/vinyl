import { describe, expect, it } from "vitest";
import { getZonedDateParts, isValidTimezone } from "../timezone";

describe("timezone-aware calendar fields", () => {
  it("uses the account zone rather than the server zone", () => {
    const parts = getZonedDateParts(new Date("2026-01-06T01:30:00.000Z"), "America/New_York");
    expect(parts.weekday).toBe("Mon");
    expect(parts.hour).toBe(20);
  });

  it("accepts IANA zones and rejects arbitrary strings", () => {
    expect(isValidTimezone("Africa/Lagos")).toBe(true);
    expect(isValidTimezone("not/a-zone")).toBe(false);
  });
});
