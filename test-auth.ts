import crypto from 'crypto';
const hashStr = 'eb9c6d8572af0e945fef60acc31cfc24:5d29c5368c1a1c5c598dd907db80422dacfbf28a6c45ecfca5328b831a495cd32df78d670b4778b1349f4ef788819381de5ab1c6dd02b984d854419c01d8b4f0';
const password = 'admin123';
const [salt, key] = hashStr.split(':');
const hashedBuffer = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512');
const keyBuffer = Buffer.from(key, 'hex');
console.log('Match?', crypto.timingSafeEqual(hashedBuffer, keyBuffer));
