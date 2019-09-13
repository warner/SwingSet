import path from 'path';
import { buildVatController, loadBasedir } from '../src';
import { makeStorageInMemory } from '../src/stateInMemory';

async function measure(f) {
  const t0 = Date.now();
  await f();
  const t1 = Date.now();
  return t1 - t0;
}

async function run() {
  const cfg = await loadBasedir(__dirname);
  const realStorage = {};
  // const storage = {};
  const counts = { has: 0, get: 0, set: 0 };
  const handler = {
    has(target, name) {
      counts.has++;
      return name in target;
    },
    get(target, name) {
      counts.get++;
      return target[name];
    },
    set(target, name, val) {
      counts.set++;
      return Reflect.set(target, name, val);
    },
  };
  const storage = new Proxy(realStorage, handler);
  cfg.externalStorage = makeStorageInMemory(storage);
  const withSES = true;
  const c = await buildVatController(cfg, withSES, []);
  function addCall() {
    c.queueToExport('small', 0, 'run', '{"args":[]}');
  }
  function add100Calls() {
    for (let i = 0; i < 100; i++) {
      addCall();
    }
  }

  const prev = { ms: 1, has: 0, get: 0, set: 0 };
  for (let i = 0; i < 100; i++) {
    add100Calls();
    const ms = await measure(() => c.run());
    console.log(
      i,
      ms,
      counts.has - prev.has,
      counts.get - prev.get,
      counts.set - prev.set,
      ms / prev.ms,
    );
    prev.ms = ms;
    prev.has = counts.has;
    prev.get = counts.get;
    prev.set = counts.set;
  }
}

run();
