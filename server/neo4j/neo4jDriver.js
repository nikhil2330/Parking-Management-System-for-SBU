require('dotenv').config({ path: './config/.env' });
const neo4j = require('neo4j-driver');

(async () => {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;
  let driver;

  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const serverInfo = await driver.getServerInfo();
    console.log('Connection established');
    console.log(serverInfo);
  } catch (err) {
    console.log(`Connection error\n${err}\nCause: ${err}`);
  } finally {
    if (driver) {
      await driver.close();
    }
  }
})();
