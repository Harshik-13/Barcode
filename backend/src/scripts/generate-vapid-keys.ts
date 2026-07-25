import { generateKeyPairSync } from 'crypto';

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

const { publicKey, privateKey } = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
});

const publicKeyBuffer = publicKey.export({ type: 'spki', format: 'der' });
const privateKeyBuffer = privateKey.export({ type: 'pkcs8', format: 'der' });

const vapidPublicKey = base64UrlEncode(publicKeyBuffer);
const vapidPrivateKey = base64UrlEncode(privateKeyBuffer);

console.log('VAPID_PUBLIC_KEY=' + vapidPublicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidPrivateKey);
console.log();
console.log('Add these to your .env file:');
console.log('VAPID_PUBLIC_KEY=' + vapidPublicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidPrivateKey);