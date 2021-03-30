"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envload = void 0;
const dotenv = require("dotenv");
const nodeEnv = process.env.NODE_ENV
    ? process.env.NODE_ENV.trim()
    : 'production';
const envload = () => {
    switch (nodeEnv) {
        case 'test':
            dotenv.config({ path: `.env.test` });
            break;
        default:
            dotenv.config({ path: `.env` });
            break;
    }
};
exports.envload = envload;
//# sourceMappingURL=env_load.js.map