"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisURL = void 0;
exports.redisURL = `redis://root:${process.env.REDIS_PASSWORD}@${process.env.REDIS_URL}:${process.env.REDIS_PORT}`;
//# sourceMappingURL=index.js.map