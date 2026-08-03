// /* eslint-env node, mocha */
// const assert = require('assert');
// const path = require('path');
// const {Application} = require('spectron');

// // construct paths
// const baseDir = path.join(__dirname, '..');
// const electronBinary = path.join(baseDir, 'node_modules', '.bin', 'electron');

// // utility functions
// const sleep = time => new Promise(r => setTimeout(r, time));

// describe('Application launch', function() {
//   this.timeout(20000);

//   const app = new Application({
//     path: electronBinary,
//     args: [baseDir],
//   });

//   before(() => app.start());

//   after(() => app.stop());

//   it('Shows an initial window', async () => {
//     await app.client.waitUntilWindowLoaded();
//     const count = await app.client.getWindowCount();
//     assert.equal(count, 1);
//   });

  
// });