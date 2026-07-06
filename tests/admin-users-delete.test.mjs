import assert from "node:assert/strict";
import { test } from "node:test";
import { onRequestDelete } from "../functions/api/admin/users.js";

function makeEnv() {
  const calls = [];
  return {
    calls,
    ADMIN_TOKEN: "secret-token",
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            calls.push({ sql, args });
            return {
              async run() {
                return { success: true };
              },
            };
          },
        };
      },
    },
  };
}

test("admin delete rejects requests without ADMIN_TOKEN", async () => {
  const env = makeEnv();
  const request = new Request("https://example.com/api/admin/users", {
    method: "DELETE",
    body: JSON.stringify({ id: "user_1" }),
  });

  const response = await onRequestDelete({ request, env });
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.error, "未授权");
  assert.equal(env.calls.length, 0);
});

test("admin delete removes user-related rows before deleting user", async () => {
  const env = makeEnv();
  const request = new Request("https://example.com/api/admin/users", {
    method: "DELETE",
    headers: { authorization: "Bearer secret-token" },
    body: JSON.stringify({ id: "user_1" }),
  });

  const response = await onRequestDelete({ request, env });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { ok: true, deletedUserId: "user_1" });
  assert.equal(env.calls.length, 5);
  assert.match(env.calls[0].sql, /DELETE FROM sessions/i);
  assert.match(env.calls[1].sql, /DELETE FROM inquiries WHERE buyer_id/i);
  assert.match(env.calls[2].sql, /printer_id IN/i);
  assert.match(env.calls[3].sql, /DELETE FROM printers/i);
  assert.match(env.calls[4].sql, /DELETE FROM users/i);
  assert.deepEqual(env.calls.map((call) => call.args), [["user_1"], ["user_1"], ["user_1"], ["user_1"], ["user_1"]]);
});
