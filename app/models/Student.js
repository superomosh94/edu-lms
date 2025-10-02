const db = require('../controllers/config/db'); // MySQL connection

const Notification = {
    create: async (notificationData) => {
        const { user_id, title, message, type = 'info', related_id = null, related_type = null } = notificationData;
        const sql = `
            INSERT INTO notifications (user_id, title, message, type, related_id, related_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        const [result] = await db.execute(sql, [
            user_id,
            title,
            message,
            type,
            related_id !== undefined ? related_id : null,
            related_type !== undefined ? related_type : null
        ]);
        return result.insertId;
    },

    findByUserId: async (userId, limit = 10) => {
        const sql = `
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        const [rows] = await db.execute(sql, [userId, limit]);
        return rows;
    },

    markAsRead: async (notificationId, userId) => {
        const sql = `
            UPDATE notifications 
            SET is_read = 1, read_at = NOW() 
            WHERE id = ? AND user_id = ?
        `;
        const [result] = await db.execute(sql, [notificationId, userId]);
        return result.affectedRows > 0;
    },

    markAllAsRead: async (userId) => {
        const sql = `
            UPDATE notifications 
            SET is_read = 1, read_at = NOW() 
            WHERE user_id = ? AND is_read = 0
        `;
        const [result] = await db.execute(sql, [userId]);
        return result.affectedRows;
    },

    getUnreadCount: async (userId) => {
        const sql = `
            SELECT COUNT(*) as count 
            FROM notifications 
            WHERE user_id = ? AND is_read = 0
        `;
        const [rows] = await db.execute(sql, [userId]);
        return rows[0].count;
    },

    getForStudent: async (studentId, limit = 10) => {
        const sql = `
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        const [rows] = await db.execute(sql, [studentId, limit]);
        return rows;
    }
};

module.exports = Notification;
