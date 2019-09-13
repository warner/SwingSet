import path from 'path';
import fs from 'fs';
import process from 'process';
import { buildVatController, loadBasedir } from '../../src';

async function measure(f) {
  const t0 = process.hrtime.bigint();
  await f();
  const t1 = process.hrtime.bigint(); // nanoseconds
  return t1 - t0; // nanoseconds
}

async function run(oldstatefile) {
  const config = { vats: new Map() };
  config.vats.set('small', { sourcepath: require.resolve('./vat-small'), options: {} });
  config.initialState = JSON.stringify({});
  if (oldstatefile) {
    let data;
    const read_time = await measure(() => {
      data = fs.readFileSync(oldstatefile);
    });
    const parse_time = await measure(() => {
      config.initialState = JSON.parse(data);
    });
    console.log(`read: ${read_time}`);
    console.log(`parse: ${parse_time}`);
  }    
  const withSES = false;
  let c;
  const build_time = await measure(async () => {
    c = await buildVatController(config, withSES, []);
  });
  console.log(`build: ${build_time}`);
  console.log('count run total_run getstate state_length heap_used heap_total');

  function addCall(count) {
    for (let i = 0; i < count; i++) {
      c.queueToExport('small', 'o+0', 'add', '{"args":[]}');
    }
  }

  let total_run = 0n;
  const COUNT = 10;
  for (let i = 1; i < 2002; i++) {
    addCall(COUNT);
    const run = await measure(() => {
      c.run();
    });
    total_run += run;
    let len;
    const getstate = await measure(() => {
      len = c.getState().length;
    });
    const m = process.memoryUsage();
    console.log(`${i*COUNT} ${run/BigInt(COUNT)} ${total_run} ${getstate} ${len} ${m.heapUsed} ${m.heapTotal}`);
  }
}

run();
