/**
 * Session-based authentication middleware for admin routes.
 * Checks if the user has an active admin session.
 */
function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    return res.status(401).json({ error: 'Yetkisiz erişim. Lütfen giriş yapın.' });
}

module.exports = { requireAuth };
