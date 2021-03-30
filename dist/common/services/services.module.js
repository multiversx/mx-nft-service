"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesModule = void 0;
const common_1 = require("@nestjs/common");
const redlock_1 = require("./redlock");
const nestjs_redis_1 = require("nestjs-redis");
let ServicesModule = class ServicesModule {
};
ServicesModule = __decorate([
    common_1.Module({
        providers: [redlock_1.RedlockService],
        exports: [redlock_1.RedlockService],
        imports: [
            nestjs_redis_1.RedisModule.register({
                host: process.env.REDIS_URL,
                port: parseInt(process.env.REDIS_PORT),
                keyPrefix: process.env.REDIS_PREFIX,
            }),
        ],
    })
], ServicesModule);
exports.ServicesModule = ServicesModule;
//# sourceMappingURL=services.module.js.map