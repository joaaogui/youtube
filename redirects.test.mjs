import assert from "node:assert/strict";
import { test } from "node:test";

import nextConfig from "./next.config.mjs";

test("redirects www.joaog.space to the portfolio with 308 semantics", async () => {
  const redirects = await nextConfig.redirects();
  const apexRedirect = redirects.find(
    (entry) =>
      entry.source === "/" &&
      entry.destination === "https://joaog.space/" &&
      entry.permanent === true &&
      entry.has?.some(
        (condition) =>
          condition.type === "host" && condition.value === "www.joaog.space",
      ),
  );

  assert.ok(
    apexRedirect,
    "expected a host-scoped permanent redirect from www.joaog.space/",
  );
});

test("redirects legacy channel routes to the YouTube app", async () => {
  const redirects = await nextConfig.redirects();
  assert.ok(
    redirects.some(
      (entry) =>
        entry.source === "/channel/:path*" &&
        entry.destination === "https://youtube.joaog.space/" &&
        entry.permanent === true,
    ),
  );
});
