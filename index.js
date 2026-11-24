require('dotenv').config();
const app = require('./src/app');
const pool = require('./src/config/db');

async function start() {
  const connection = await pool.getConnection();
  connection.release();
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API disponible sur http://localhost:${port}`));
}

start().catch(async (error) => {
  console.error('Impossible de demarrer : connexion MySQL echouee.', error.message);
  await pool.end();
  process.exitCode = 1;
});
