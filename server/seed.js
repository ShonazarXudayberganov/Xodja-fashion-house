const { seedDefaults, useBlobs } = require('./dataStore');

const reset = process.argv.includes('--reset');

seedDefaults({ reset })
  .then(() => {
    console.log(reset ? 'Data reset complete' : 'Data seed complete');
    console.log(`Storage: ${useBlobs() ? 'netlify-blobs' : 'local-json'}`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
