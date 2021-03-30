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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElrondProxyService = void 0;
const erdjs_1 = require("@elrondnetwork/erdjs");
const config_1 = require("../../../config");
const common_1 = require("@nestjs/common");
const query_1 = require("@elrondnetwork/erdjs/out/smartcontracts/query");
const nest_winston_1 = require("nest-winston");
const cache_manager_service_1 = require("../cache-manager/cache-manager.service");
const smartcontracts_1 = require("@elrondnetwork/erdjs/out/smartcontracts");
const helpers_1 = require("../../../helpers");
let ElrondProxyService = class ElrondProxyService {
    constructor(cacheManager, logger) {
        this.cacheManager = cacheManager;
        this.logger = logger;
        this.proxy = new erdjs_1.ProxyProvider(config_1.elrondConfig.gateway, 60000);
    }
    getService() {
        return this.proxy;
    }
    async getAllContractAddresses() {
        const cachedData = await this.cacheManager.getAllContractAddresses();
        if (!!cachedData) {
            return smartcontracts_1.QueryResponse.fromHttpResponse(cachedData);
        }
        const query = new query_1.Query({
            address: new erdjs_1.Address(config_1.elrondConfig.stakingContract),
            func: new erdjs_1.ContractFunction('getAllContractAddresses'),
        });
        const result = await this.proxy.queryContract(query);
        this.logger.info('getContractList', {
            path: 'elrond-proxy.service.getContractList',
            returnCode: result.returnCode,
            returnMessage: result.returnMessage,
        });
        await this.cacheManager.setAllContractAddresses(helpers_1.QueryResponseHelper.getDataForCache(result));
        return result;
    }
};
ElrondProxyService = __decorate([
    common_1.Injectable(),
    __param(1, common_1.Inject(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [cache_manager_service_1.CacheManagerService, Object])
], ElrondProxyService);
exports.ElrondProxyService = ElrondProxyService;
//# sourceMappingURL=elrond-proxy.service.js.map