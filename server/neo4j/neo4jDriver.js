require('dotenv').config({ path: './config/.env' });
const neo4j = require('neo4j-driver');

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    disableLosslessIntegers: true 
});

driver.getServerInfo()
  .then(() => console.log('Neo4j works'))
  .catch(err => console.error('Neo4j connection issue:', err));

module.exports = driver;