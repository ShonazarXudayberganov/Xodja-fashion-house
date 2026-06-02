const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('\n  Xodija Fashion House');
  console.log('  -------------------------------------');
  console.log(`  Sayt:        http://localhost:${PORT}/`);
  console.log(`  Admin:       http://localhost:${PORT}/admin/`);
  console.log('  Login:       admin / admin123');
  console.log('  -------------------------------------\n');
});
