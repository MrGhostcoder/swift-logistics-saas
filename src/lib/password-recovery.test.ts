import { describe, expect, test } from "bun:test";
import { validRecovery } from "./password-recovery";

describe("recovery session eligibility", () => {
  test("accepts the same user's unexpired recovery", () => {
    expect(validRecovery({ userId: "customer-a", expiresAt: 2000 }, "customer-a", 1000)).toBe(true);
  });
  test("does not accept another user's recovery", () => {
    expect(validRecovery({ userId: "customer-a", expiresAt: 2000 }, "customer-b", 1000)).toBe(false);
  });
  test("does not accept an expired recovery", () => {
    expect(validRecovery({ userId: "customer-a", expiresAt: 2000 }, "customer-a", 2000)).toBe(false);
  });
  test("ordinary signed-in users have no recovery", () => {
    expect(validRecovery(null, "customer-a", 1000)).toBe(false);
  });
});