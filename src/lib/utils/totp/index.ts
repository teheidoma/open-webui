export function base32Encode(arr) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let padding = 8 - Math.ceil(arr.length * 8 / 5) % 8;
    if (padding === 8) padding = 0;

    let bits = 0, value = 0, output = '';
    for (let i = 0; i < arr.length; i++) {
        value = (value << 8) | arr[i];
        bits += 8;

        while (bits >= 5) {
            output += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }

    if (bits > 0) {
        output += alphabet[(value << (5 - bits)) & 31];
    }

    return output + '===='.substring(0, padding);
}

export function generateSecret(length = 16) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return base32Encode(array);
}
export async function getHMAC(key, counter) {
    const counterBytes = new ArrayBuffer(8);   // Counter must be a big-endian 64-bit integer
    const view = new DataView(counterBytes);

    for (let i = 7; i >= 0; --i) {
        view.setUint8(i, counter & 0xff);
        counter = counter >> 8;
    }

    const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        key,
        {
            name: 'HMAC',
            hash: { name: 'SHA-1' },           // TOTP uses SHA-1 hashing by default
        },
        false,
        ['sign']
    );

    return await window.crypto.subtle.sign('HMAC', cryptoKey, counterBytes);
}

export async function totp(secret, timeStep = 30, digits = 6) {
    const currentTimeStep = Math.floor(Date.now() / 1000 / timeStep);

    // Base32 decoding (reverse of encode). We're skipping padding characters if any.
    const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let key = new Uint8Array(secret.length * 5 / 8);   // Length is reduced post decoding
    let bits = 0, value = 0, index = 0;

    for (const char of secret.replace(/=+$/, "")) {
        value = (value << 5) | base32Alphabet.indexOf(char.toUpperCase());
        bits += 5;

        if (bits >= 8) {
            key[index++] = (value >>> (bits - 8)) & 255;
            bits -= 8;
        }
    }

    // Get the HMAC based on current timeStep as the counter
    const hmacResult = await getHMAC(key, currentTimeStep);
    const hmacArray = new Uint8Array(hmacResult);

    // Dynamic truncation to extract the OTP
    const offset = hmacArray[hmacArray.length - 1] & 0xf;
    const binary = ((hmacArray[offset] & 0x7f) << 24) |
                 ((hmacArray[offset + 1] & 0xff) << 16) |
                 ((hmacArray[offset + 2] & 0xff) << 8) |
                 (hmacArray[offset + 3] & 0xff);

    const otp = binary % (10 ** digits);   // Reduce the result to a 6-digit number

    return otp.toString().padStart(digits, '0');
}