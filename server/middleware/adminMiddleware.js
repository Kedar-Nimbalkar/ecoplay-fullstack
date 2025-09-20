const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

const educator = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'educator')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin or educator' });
    }
};

module.exports = { admin, educator };