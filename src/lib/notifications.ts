import { query } from './db';

export async function createNotification(deviceId: string, type: string, message: string, amount: number | null = null, confessionId: string | null = null) {
    try {
        await query(`
            INSERT INTO notifications (device_id, type, message, amount, confession_id)
            VALUES ($1, $2, $3, $4, $5)
        `, [deviceId, type, message, amount, confessionId]);
    } catch (e) {
        console.error('Failed to create notification:', e);
    }
}
