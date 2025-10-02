const db = require('../controllers/config/db');

class Notification {
    static async create(data) {
        try {
            const {
                user_id,
                title,
                message,
                type = 'info',
                related_id = null,
                related_type = null
            } = data;

            if (!user_id || !title || !message) {
                throw new Error('user_id, title, and message are required');
            }

            const sql = `
                INSERT INTO notifications
                (user_id, title, message, type, related_id, related_type, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `;

            const [result] = await db.execute(sql, [
                user_id,
                title,
                message,
                type,
                related_id ?? null,
                related_type ?? null
            ]);

            return result.insertId;
        } catch (error) {
            console.error('Notification.create error:', error);
            throw error;
        }
    }

    static async findByUserId(userId, limit = 10) {
        try {
            if (!userId) throw new Error('userId is required');

            limit = parseInt(limit);
            if (isNaN(limit) || limit <= 0) limit = 10;

            const sql = `
                SELECT *
                FROM notifications
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ${limit}
            `;
            const [rows] = await db.execute(sql, [userId]);
            return rows;
        } catch (error) {
            console.error('Notification.findByUserId error:', error);
            throw error;
        }
    }

    static async markAsRead(notificationId, userId) {
        try {
            if (!notificationId || !userId) {
                throw new Error('notificationId and userId are required');
            }

            const sql = `
                UPDATE notifications
                SET is_read = 1, read_at = NOW()
                WHERE id = ? AND user_id = ?
            `;
            const [result] = await db.execute(sql, [notificationId, userId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Notification.markAsRead error:', error);
            throw error;
        }
    }

    static async markAllAsRead(userId) {
        try {
            if (!userId) throw new Error('userId is required');

            const sql = `
                UPDATE notifications
                SET is_read = 1, read_at = NOW()
                WHERE user_id = ? AND is_read = 0
            `;
            const [result] = await db.execute(sql, [userId]);
            return result.affectedRows;
        } catch (error) {
            console.error('Notification.markAllAsRead error:', error);
            throw error;
        }
    }

    static async getUnreadCount(userId) {
        try {
            if (!userId) throw new Error('userId is required');

            const sql = `
                SELECT COUNT(*) AS count
                FROM notifications
                WHERE user_id = ? AND is_read = 0
            `;
            const [rows] = await db.execute(sql, [userId]);
            return rows[0]?.count || 0;
        } catch (error) {
            console.error('Notification.getUnreadCount error:', error);
            throw error;
        }
    }

    static async getForStudent(studentId, limit = 10) {
        try {
            if (!studentId) throw new Error('studentId is required');

            limit = parseInt(limit);
            if (isNaN(limit) || limit <= 0) limit = 10;

            const sql = `
                SELECT id, title, message, type, related_id, related_type, is_read, created_at
                FROM notifications
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ${limit}
            `;
            const [rows] = await db.execute(sql, [studentId]);
            return rows;
        } catch (error) {
            console.error('Notification.getForStudent error:', error);
            throw error;
        }
    }
}

module.exports = Notification;
