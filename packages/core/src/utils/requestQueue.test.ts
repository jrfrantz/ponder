import type { Common } from "@/Ponder.js";
import { setupAnvil } from "@/_test/setup.js";
import { anvil } from "@/_test/utils.js";
import { http, RpcRequestError } from "viem";
import { beforeEach, expect, test } from "vitest";
import { createRequestQueue } from "./requestQueue.js";
import { wait } from "./wait.js";

beforeEach((context) => setupAnvil(context));

/** Creates a request queue with a `maxRequestsPerSecond` of 1. */
const getQueue = (common: Common) => {
  const _transport = http()({ chain: anvil });

  return createRequestQueue({
    maxRequestsPerSecond: 1,
    metrics: common.metrics,
    transport: { ..._transport.config, ..._transport.value },
    networkName: "anvil",
  });
};

test("pause + start", async ({ common }) => {
  const queue = getQueue(common);
  queue.pause();

  const r = queue.request({ method: "eth_chainId" });

  expect(await queue.size()).toBe(1);
  expect(await queue.pending()).toBe(0);

  queue.start();

  await r;

  expect(await queue.size()).toBe(0);
  expect(await queue.pending()).toBe(0);
});

test("size and pending", async ({ common }) => {
  const queue = getQueue(common);
  queue.pause();

  const r1 = queue.request({ method: "eth_chainId" });
  queue.request({ method: "eth_chainId" });

  queue.start();

  await r1;

  expect(await queue.size()).toBe(1);
  expect(await queue.pending()).toBe(0);
});

test("request per second", async ({ common }) => {
  const queue = getQueue(common);

  const r1 = queue.request({ method: "eth_chainId" });
  const r2 = queue.request({ method: "eth_chainId" });

  await r1;

  expect(await queue.size()).toBe(1);
  expect(await queue.pending()).toBe(0);

  await wait(500);

  expect(await queue.size()).toBe(1);
  expect(await queue.pending()).toBe(0);

  await r2;

  expect(await queue.size()).toBe(0);
  expect(await queue.pending()).toBe(0);
});

test("add() returns promise", async ({ common }) => {
  const queue = getQueue(common);

  const r1 = queue.request({ method: "eth_chainId" });

  expect(await r1).toBe("0x1");
});

test("request() error", async ({ common }) => {
  const queue = getQueue(common);

  let error: any;

  const r1 = queue
    .request({
      method: "eth_getBlocByHash" as "eth_getBlockByHash",
      params: ["0x", false],
    })
    .catch((_error: any) => {
      error = _error;
    });

  await r1;

  expect(error).toBeInstanceOf(RpcRequestError);
});
