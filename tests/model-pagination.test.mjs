import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const html = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");

test("homepage model gallery includes frontend pagination controls", () => {
  assert.match(html, /id="modelPager"/, "model list should render a pagination container");
  assert.match(html, /modelsPerPage\s*=\s*8/, "homepage should show 8 models per page");
  assert.match(html, /function\s+setModelPage\(/, "pagination should expose a page switching function");
  assert.match(html, /共 \$\{filtered\.length\} 个模型/, "pagination should show total model count");
});
