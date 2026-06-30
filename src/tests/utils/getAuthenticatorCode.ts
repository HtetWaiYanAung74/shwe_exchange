import { createGuardrails, generate } from 'otplib';
import config from './config';

export default function getAuthenticatorCode(): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const token = generate({
                secret: config.twoFASecret,
                guardrails: createGuardrails({ MIN_SECRET_BYTES: 10 }),
            });
            resolve(token);
        } catch (error) {
            console.error('Error generating authenticator code:', error);
            reject(error);
        }
    });
}
