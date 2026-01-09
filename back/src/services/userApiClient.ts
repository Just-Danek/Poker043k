
import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const API_URL = process.env.DB_API_URL || "https://tapapi.14th.ru";
const SECRET_KEY = process.env.POKER_SECRET_KEY;
if (!SECRET_KEY) throw new Error("FATAL ERROR: SECRET_KEY is missing in .env");

const CLIENT_ID = process.env.CLIENT_ID;
if (!CLIENT_ID) throw new Error("FATAL ERROR: CLIENT_ID is missing in .env");

function friendNormalizeBody(body: any): string {
    const sortedKeys = Object.keys(body).sort();
    const sortedObj: any = {};
    for (const key of sortedKeys) {
        sortedObj[key] = body[key];
    }
    return JSON.stringify(sortedObj, null, 0).replace(/:/g, ":").replace(/,/g, ",");
}

function makeHmac(method: string, path: string, timestamp: string, nonce: string, body: any): string {
    const message = [
        method.toUpperCase(),
        path,
        timestamp,
        nonce,
        friendNormalizeBody(body)
    ].join('\n');

    const hmac = crypto.createHmac('sha256', SECRET_KEY as string);
    hmac.update(message);
    return hmac.digest('hex');
}

export interface ExternalUserProfile {
    telegram_id: number;
    username: string;
    balance: number;
}

interface StateResponseWire {
    user_id: number;
    points: number;
}

export const userApiClient = {
    async getUser(telegramId: number): Promise<ExternalUserProfile | null> {
        console.log(`[API] Fetching profile for ID: ${telegramId}, URL: ${API_URL}/state`);
        try {
            const response = await axios.get<StateResponseWire>(`${API_URL}/state`, {
                headers: { 
                    'X-User-Id': telegramId.toString(),
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data;
            console.log(`[API] Successfully received data for ${telegramId}:`, JSON.stringify(data));

            return {
                telegram_id: data.user_id,
                username: `Player_${data.user_id}`,
                balance: data.points
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(`[API ERROR] Failed to get user ${telegramId}: Status: ${error.response?.status}, Data:`, JSON.stringify(error.response?.data), `Message: ${error.message}`);
            } else {
                console.error(`[API ERROR] Non-Axios error for user ${telegramId}:`, error);
            }
            return null; 
        }
    },

    async updateBalance(telegramId: number, amount: number, roomId: string, _action: string) {
        try {
            const body = {
                telegram_id: telegramId,
                amount: amount,
                room_id: roomId,
            };

            const timestamp = Math.floor(Date.now() / 1000).toString();
            const nonce = crypto.randomUUID().replace(/-/g, '');
            const path = "/poker/transaction";
            
            const signature = makeHmac(
                "POST",
                path,
                timestamp,
                nonce,
                body
            );

            await axios.post(`${API_URL}${path}`, body, {
                headers: {
                    "X-Client-Id": CLIENT_ID,
                    "X-Timestamp": timestamp,
                    "X-Nonce": nonce,
                    "X-Signature": signature,
                    "Content-Type": "application/json",
                }
            });
            console.log(`[API] Balance updated for ${telegramId}: ${amount > 0 ? '+' : ''}${amount}`);
        } catch (error) {
            console.error(`[API] Failed to update balance for ${telegramId}:`, axios.isAxiosError(error) ? error.message : error);
        }
    }
};
