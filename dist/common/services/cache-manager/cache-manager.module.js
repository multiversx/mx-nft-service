"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManagerModule = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_service_1 = require("./cache-manager.service");
const redisStore = require("cache-manager-redis-store");
let CacheManagerModule = class CacheManagerModule {
};
CacheManagerModule = __decorate([
    common_1.Module({
        providers: [cache_manager_service_1.CacheManagerService],
        imports: [
            common_1.CacheModule.register({
                ttl: 60 * 5,
                store: redisStore,
                host: process.env.REDIS_URL,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD,
                prefix: process.env.REDIS_PREFIX,
            }),
        ],
        exports: [cache_manager_service_1.CacheManagerService],
    })
], CacheManagerModule);
exports.CacheManagerModule = CacheManagerModule;
//# sourceMappingURL=cache-manager.module.js.map