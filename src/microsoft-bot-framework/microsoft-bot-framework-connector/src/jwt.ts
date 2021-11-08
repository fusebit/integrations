import superagent from 'superagent';
import jwt from 'jsonwebtoken';

const urlToKey: { [index: string]: { [index: string]: string } } = {};

export async function verifyJwt(token: string, jwksUrl: string): Promise<any> {
  const resolvedSecret = await resolveSecret(token, jwksUrl);
  return new Promise((resolve, reject) => {
    jwt.verify(token, resolvedSecret, {}, (error: any, verifiedToken: any) => {
      if (error) {
        return reject(error);
      }
      resolve(verifiedToken);
    });
  });
}

function decodeJwtHeader(token: string) {
  const decoded = jwt.decode(token, { complete: true }) as { [key: string]: any };
  if (decoded && decoded.header) {
    return decoded.header;
  }
  return undefined;
}

function getCachedKey(kid: string, url: string) {
  const kidsForUrl = urlToKey[url];
  if (kidsForUrl) {
    return kidsForUrl[kid];
  }
  return undefined;
}

async function downloadJson(url: string) {
  let response;
  try {
    response = await superagent.get(url);
  } catch (error) {
    throw new Error(`Unable to acquire JWKS at '${url}'; download failed: ${error}`);
  }

  if (response.status !== 200) {
    throw new Error(`Unable to acquire JWKS at '${url}'; status code: '${response.status}'.`);
  }

  return response.body;
}

function certToPEM(cert: string) {
  const match = cert.match(/.{1,64}/g) || [];
  return `-----BEGIN CERTIFICATE-----\n${match.join('\n')}\n-----END CERTIFICATE-----\n`;
}

function prepadSigned(hex: string) {
  const msb = hex[0];
  if (msb < '0' || msb > '7') {
    return `00${hex}`;
  }
  return hex;
}

function rsaPublicKeyToPEM(modulusB64: string, exponentB64: string) {
  const modulus = Buffer.from(modulusB64, 'base64');
  const exponent = Buffer.from(exponentB64, 'base64');

  const modulusHex = prepadSigned(modulus.toString('hex'));
  const exponentHex = prepadSigned(exponent.toString('hex'));

  const modlen = modulusHex.length / 2;
  const explen = exponentHex.length / 2;

  const encodedModlen = encodeLengthHex(modlen);
  const encodedExplen = encodeLengthHex(explen);
  const encodedPubkey =
    '30' +
    encodeLengthHex(modlen + explen + encodedModlen.length / 2 + encodedExplen.length / 2 + 2) +
    '02' +
    encodedModlen +
    modulusHex +
    '02' +
    encodedExplen +
    exponentHex;

  const der = Buffer.from(encodedPubkey, 'hex').toString('base64') as string;

  let pem = `-----BEGIN RSA PUBLIC KEY-----\n`;
  pem += `${(der.match(/.{1,64}/g) || []).join('\n')}`;
  pem += `\n-----END RSA PUBLIC KEY-----\n`;
  return pem;
}

function numberToHex(value: number) {
  const asString = value.toString(16);
  if (asString.length % 2) {
    return `0${asString}`;
  }
  return asString;
}

function encodeLengthHex(length: number) {
  if (length <= 127) {
    return numberToHex(length);
  }
  const hexNumber = numberToHex(length);
  const lengthOfLengthByte = 128 + hexNumber.length / 2;
  return numberToHex(lengthOfLengthByte) + hexNumber;
}

function parseJwks(kid: string, url: string, json: any) {
  for (const key of json.keys) {
    if (key.use === 'sig' && key.kty === 'RSA' && key.kid && ((key.x5c && key.x5c.length) || (key.n && key.e))) {
      const keyLookup = (urlToKey[url] = urlToKey[url] || {});
      keyLookup[key.kid] = key.x5c && key.x5c.length ? certToPEM(key.x5c[0]) : rsaPublicKeyToPEM(key.n, key.e);
    }
  }
}

async function resolveSecret(token: string, jwksUrl: string): Promise<string> {
  const decodedToken = decodeJwtHeader(token);
  const kid = decodedToken.kid;
  if (!kid) {
    throw new Error("Unable to resolve secret. Token header does not have a 'kid' value.");
  }

  let key = getCachedKey(kid, jwksUrl);
  if (!key) {
    const json = await downloadJson(jwksUrl);
    parseJwks(kid, jwksUrl, json);
    key = getCachedKey(kid, jwksUrl);
  }

  if (!key) {
    throw new Error('Unable to resolve secret; key not found in downloaded key file');
  }
  return key;
}
