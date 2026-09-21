import { describe, expect, it } from "vitest";
import { describeVibe } from "../vibe";

describe("describeVibe", () => {
  it("labels night, morning, afternoon, and the rest", () => {
    expect(describeVibe(null)).toBe("Balanced Listener");
    expect(describeVibe(23)).toBe("Night Owl");
    expect(describeVibe(2)).toBe("Night Owl");
    expect(describeVibe(7)).toBe("Early Bird");
    expect(describeVibe(15)).toBe("Afternoon Connoisseur");
    expect(describeVibe(12)).toBe("Balanced Listener");
  });
});
