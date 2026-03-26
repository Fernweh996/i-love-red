"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    console.error('Server error:', err.message);
    res.status(500).json({
        error: err.message || 'Internal server error',
    });
}
//# sourceMappingURL=error-handler.js.map