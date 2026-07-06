import assert from "node:assert/strict";
import { test } from "node:test";
import { onRequestPost } from "../functions/api/auth/register.js";

function makeEnv() {
  const calls = [];
  return {
    calls,
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            calls.push({ sql, args });
            return {
              async first() {
                return null;
              },
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

test("register records automatic agreement to terms and privacy policy", async () => {
  const env = makeEnv();
  const request = new Request("https://example.com/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "测试用户",
      phone: "13800000001",
      password: "123456",
      role: "buyer",
    }),
  });

  const response = await onRequestPost({ request, env });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.user.phone, "13800000001");

  const insert = env.calls.find((call) => /INSERT INTO users/i.test(call.sql));
  assert.ok(insert, "register should insert a user row");
  assert.match(insert.sql, /terms_version/i);
  assert.match(insert.sql, /privacy_version/i);
  assert.match(insert.sql, /agreed_at/i);
  assert.equal(insert.args.at(-4), "2026-07-06");
  assert.equal(insert.args.at(-3), "2026-07-06");
  assert.equal(typeof insert.args.at(-2), "number");
});
