"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheConfig = exports.elrondConfig = void 0;
const env_load_1 = require("./env_load");
env_load_1.envload();
const config = require("config");
exports.elrondConfig = config.get('elrond');
exports.cacheConfig = config.get('caching');
//# sourceMappingURL=index.js.map