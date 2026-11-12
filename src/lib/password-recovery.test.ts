import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
import { validRecovery } from "./password-recovery";

describe("recovery session eligibility", () => {
  test("accepts the same user's unexpired recovery", () => {
    assert.equal(validRecovery({ userId: "customer-a", expiresAt: 2000 }, "customer-a", 1000), true);
  });
  test("does not accept another user's recovery", () => {
    assert.equal(validRecovery({ userId: "customer-a", expiresAt: 2000 }, "customer-b", 1000), false);
  });
  test("does not accept an expired recovery", () => {
    assert.equal(validRecovery({ userId: "customer-a", expiresAt: 2000 }, "customer-a", 2000), false);
  });
  test("ordinary signed-in users have no recovery", () => {
    assert.equal(validRecovery(null, "customer-a", 1000), false);
  });
});