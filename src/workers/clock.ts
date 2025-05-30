interface Clock {
  tempo: number; // i.e., bpm
  beats: number; // num of beats each measure
  totalSteps: number;
  swing: number; // off-beat skew metric (percentage 0–100)
}

interface ClockOutput {
  step: number; // current step in sequence
  isFirstBeat: boolean; // indicates first beat of measure
  // TODO: is tempo necessary?
  tempo: number; // returns tempo back
}

// This is a recursive clock that runs until
// the web worker is terminated from the front end.
// Recursion is helpful to easily adjust for any
// time drift that happens as a result of executing
// the code. The clock logs the accuracy of the time
// based on the parameters for the clock given in the
// front end. Accepts any bpm, time signature, etc.
// The clock returns necessary data for moving any
// sequence along.

// TODO: swing calculation

onmessage = (e) => {
  console.log("clock starting");
  const clock: Clock = e.data;
  const interval = (60 / clock.tempo) * 1000; // ms per beat
  const startTime = performance.now();
  let stepCounter = 0;

  function scheduleNextTick() {
    // determine when the next tick should have fired since worker initialization
    console.log(performance.now());
    const expectedTime = startTime + stepCounter * interval;

    // current time of tick since worker initialization
    const currentTime = performance.now();

    // difference in current time from expected time
    const drift = currentTime - expectedTime;

    // percentage inaccuracy of tick
    const inaccuracy = (drift / interval) * 100;

    // log current step & percentage of drift inaccuracy
    console.log(
      `Step: ${(stepCounter % (clock.beats * 4)) + 1}, Drift: ${drift.toFixed(
        2
      )} ms, Inaccuracy: ${inaccuracy.toFixed(2)}%`
    );

    // message sent back to front end
    const output: ClockOutput = {
      step: (stepCounter % clock.totalSteps) + 1,
      isFirstBeat: stepCounter % clock.beats === 0,
      tempo: clock.tempo,
    };

    // send message to front end with ClockOutput object
    postMessage(output);
    stepCounter++;

    // schedule next tick, adjusted for drift
    const nextDelay = interval - drift;
    // ensure non-negative delay
    setTimeout(scheduleNextTick, Math.max(0, nextDelay));
  }

  // start recursive loop
  scheduleNextTick();
};

// OLD VERSION — too much delay and needs to account for drift
// onmessage = (e) => {
//   console.log("Web Worker clock starting!");
//   const clock: Clock = e.data;
//   const interval = (60 / clock.tempo) * 1000; // ms/beat
//   const startTime = performance.now();
//   console.log(`Interval: ${interval}`);
//   let stepCounter = 0;

//   setInterval(() => {
//     const expectedTime = startTime + stepCounter * interval;
//     const actualTime = performance.now();
//     const diff = actualTime - expectedTime;

//     const inaccuracy = (diff / interval) * 100; //percentage drift

//     console.log(
//       `Step: ${stepCounter + 1}, Inaccuracy: ${inaccuracy.toFixed(2)}%`
//     );

//     if (stepCounter === clock.totalSteps) stepCounter = 0;

//     const output: ClockOutput = {
//       step: stepCounter + 1,
//       isFirstBeat: stepCounter % clock.beats === 0,
//       tempo: clock.tempo,
//     };

//     postMessage(output);
//     stepCounter++;
//   }, interval);
// };
