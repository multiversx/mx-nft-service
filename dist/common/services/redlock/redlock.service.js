"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedlockService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_redis_1 = require("nestjs-redis");
let RedlockService = class RedlockService {
    constructor(redisService) {
        this.redisService = redisService;
        this.redisClient = this.redisService.getClient();
    }
    async lockTryOnce(resource, timeoutSeconds) {
        const date = new Date();
        date.setSeconds(date.getSeconds() + timeoutSeconds);
        const lock = await this.redisClient.setnx(resource, date.toString());
        if (lock == 0) {
            return lock;
        }
        await this.expire(resource, timeoutSeconds);
        return lock;
    }
    expire(resource, ttlSecond) {
        return this.redisClient.expire(resource, ttlSecond);
    }
};
RedlockService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [nestjs_redis_1.RedisService])
], RedlockService);
exports.RedlockService = RedlockService;
//# sourceMappingURL=redlock.service.js.map