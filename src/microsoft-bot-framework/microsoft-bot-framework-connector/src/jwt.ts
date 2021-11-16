import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const urlToKey: { [index: string]: { [index: string]: string } } = {};

export async function verifyJwt(token: string, jwksUri: string): Promise<any> {
  const resolvedSecret = await resolveSecret(token, jwksUri);
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

function setCachedKey(kid: string, jwksUri: string, key: string) {
  urlToKey[jwksUri] = {
    [kid]: key,
  };
}

async function resolveSecret(token: string, jwksUri: string): Promise<string> {
  const decodedHeader = decodeJwtHeader(token);
  const kid = decodedHeader?.kid;
  if (!kid) {
    throw new Error("Unable to resolve secret. Token is missing or its header does not have a 'kid' value.");
  }

  let key = getCachedKey(kid, jwksUri);
  if (!key) {
    const client = jwksClient({
      jwksUri,
    });
    const signingKey = await client.getSigningKey(kid);
    key = signingKey.getPublicKey();
    setCachedKey(kid, jwksUri, key);
  }

  if (!key) {
    throw new Error('Unable to resolve secret; key not found in downloaded key file');
  }
  return key;
}
