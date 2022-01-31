import tracer from 'dd-trace';
tracer.init(); // initialized in a different file to avoid hoisting.
export default tracer;

var gc = require('gc-stats')();
gc.on('stats', function (stats) {
  console.log('GC happened ', stats);
});
