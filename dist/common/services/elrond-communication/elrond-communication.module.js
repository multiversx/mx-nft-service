"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElrondCommunicationModule = void 0;
const common_1 = require("@nestjs/common");
const elrond_api_service_1 = require("./elrond-api.service");
const elrond_proxy_service_1 = require("./elrond-proxy.service");
const nonce_service_1 = require("./nonce.service");
const nestjs_redis_1 = require("nestjs-redis");
const elrond_node_service_1 = require("./elrond-node.service");
const cache_manager_module_1 = require("../cache-manager/cache-manager.module");
let ElrondCommunicationModule = class ElrondCommunicationModule {
};
ElrondCommunicationModule = __decorate([
    common_1.Module({
        providers: [
            elrond_api_service_1.ElrondApiService,
            elrond_proxy_service_1.ElrondProxyService,
            nonce_service_1.NonceService,
            elrond_node_service_1.ElrondNodeService,
        ],
        imports: [
            nestjs_redis_1.RedisModule.register({
                host: process.env.REDIS_URL,
                port: parseInt(process.env.REDIS_PORT),
                db: parseInt(process.env.REDIS_DB),
                password: process.env.REDIS_PASSWORD,
                keyPrefix: process.env.REDIS_PREFIX,
            }),
            cache_manager_module_1.CacheManagerModule,
        ],
        exports: [
            elrond_api_service_1.ElrondApiService,
            elrond_proxy_service_1.ElrondProxyService,
            nonce_service_1.NonceService,
            elrond_node_service_1.ElrondNodeService,
        ],
    })
], ElrondCommunicationModule);
exports.ElrondCommunicationModule = ElrondCommunicationModule;
//# sourceMappingURL=elrond-communication.module.js.map