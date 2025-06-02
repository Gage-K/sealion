"use strict";
// ABOUT
//
// clockWorker establishes a constant beat until terminated.
// This beat will provide consistent timing by taking
// advantage of web workers using a separate thread from
// the main thread. This beat continues at an interval set
// by an incoming message when the worker is initialized
// by the useClock hook.
//
// LOGIC
//
// If incoming message is an interval, update the interval
// for the clock.
// If incoming message is 'start', start posting tick
// messages at the rate of the interval
// If incoming message is 'stop' cease the interval loop
let interval = 25; // ms
let timerId = null;
onmessage = (e) => {
    if (e.data.interval) {
        interval = e.data.interval;
    }
    else if (e.data === "start") {
        timerId = setInterval(() => {
            postMessage("tick");
        }, interval);
    }
    else if (e.data === "stop") {
        if (timerId) {
            clearInterval(timerId);
        }
    }
};
