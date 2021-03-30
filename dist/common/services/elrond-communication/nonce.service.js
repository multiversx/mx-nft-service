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
exports.NonceService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_redis_1 = require("nestjs-redis");
const elrond_proxy_service_1 = require("./elrond-proxy.service");
const out_1 = require("@elrondnetwork/erdjs/out");
let NonceService = class NonceService {
    constructor(redisService, elrondProxyService) {
        this.redisService = redisService;
        this.elrondProxyService = elrondProxyService;
        this.nonceTTL = 6;
    }
    async getAccountWithNextAvailableNonce(address) {
        const account = await this.elrondProxyService
            .getService()
            .getAccount(new out_1.Address(address));
        const cacheKey = 'nonce_' + account.address;
        if (await this.redisService.getClient().exists(cacheKey)) {
            const cachedValue = await this.redisService.getClient().incr(cacheKey);
            if (cachedValue > account.nonce.valueOf()) {
                account.nonce = new out_1.Nonce(cachedValue);
            }
            return account;
        }
        await this.redisService
            .getClient()
            .set(cacheKey, account.nonce.valueOf(), 'ex', this.nonceTTL);
        return account;
    }
};
NonceService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [nestjs_redis_1.RedisService,
        elrond_proxy_service_1.ElrondProxyService])
], NonceService);
exports.NonceService = NonceService;
//# sourceMappingURL=nonce.service.js.map