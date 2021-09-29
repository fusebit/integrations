const http = require('http');
const fusetunnel = require('@fusebit/tunnel');

const serverPort = 3000;
const inspectionPort = 4041;

let tunnel;
let subdomain;

const startTunnel = async () => {
  tunnel = await fusetunnel({
    port: serverPort,
    host: 'https://tunnel.dev.fusebit.io',
    ...(subdomain ? { subdomain: subdomain } : {}),
  });
  subdomain = tunnel.clientId;

  console.log(`Hosting at: ${tunnel.url}`);
  updateUrlEnvVar(tunnel.url);
  console.log(`.env file updated`);

  tunnel.on('close', () => {
    // tunnels are closed
    console.log('Tunnel closed');
    updateUrlEnvVar('http://localhost:3000');
  });

  tunnel.on('request', (info) => {
    console.log(new Date().toString(), info.method, info.path);
  });

  tunnel.on('error', (e) => {
    console.log(`error before restart: ${e}`);
    // Restart after a second.
    tunnel.close();
    return setTimeout(startTunnel, 1000);
  });
};

const startHttpServer = async () => {
  http
    .createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({ tunnels: [{ proto: 'http', public_url: tunnel.url }] }));
      res.end();
    })
    .listen(inspectionPort);
};

// SET env file
const fs = require('fs');
const os = require('os');
const path = require('path');

const envFilePath = path.resolve(__dirname, '.env');

// read .env file & convert to array
const readEnvVars = () => fs.readFileSync(envFilePath, 'utf-8').split(os.EOL);

/**
 * Finds the key in .env files and returns the corresponding value
 *
 * @param {string} key Key to find
 * @returns {string|null} Value of the key
 */
const getEnvValue = (key) => {
  // find the line that contains the key (exact match)
  const matchedLine = readEnvVars().find((line) => line.split('=')[0] === key);
  // split the line (delimiter is '=') and return the item at index 2
  return matchedLine !== undefined ? matchedLine.split('=')[1] : null;
};

/**
 * Updates value for existing key or creates a new key=value line
 *
 * This function is a modified version of https://stackoverflow.com/a/65001580/3153583
 *
 * @param {string} key Key to update/insert
 * @param {string} value Value to update/insert
 */
const setEnvValue = (key, value) => {
  const envVars = readEnvVars();
  const targetLine = envVars.find((line) => line.split('=')[0] === key);
  if (targetLine !== undefined) {
    // update existing line
    const targetLineIndex = envVars.indexOf(targetLine);
    // replace the key/value with the new value
    envVars.splice(targetLineIndex, 1, `${key}=${value}`);
  } else {
    // create new key value
    envVars.push(`${key}=${value}`);
  }
  // write everything back to the file system
  fs.writeFileSync(envFilePath, envVars.join(os.EOL));
};

const updateUrlEnvVar = (tunnelUrl) => setEnvValue('BASE_URL', tunnelUrl);

startTunnel();
startHttpServer();
