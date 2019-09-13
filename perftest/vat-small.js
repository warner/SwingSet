import harden from '@agoric/harden';

function build(E) {
  let count = 0;
  return harden({
    add() {
      count += 1;
    },
  });
}

export default function setup(syscall, state, helpers) {
  return helpers.makeLiveSlots(syscall, state, E => build(E), helpers.vatID);
}
