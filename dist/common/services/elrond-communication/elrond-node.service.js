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
exports.ElrondNodeService = void 0;
const common_1 = require("@nestjs/common");
const http_service_1 = require("./http.service");
const config_1 = require("config");
const erd_response_code_1 = require("./models/enums/erd-response-code");
const errors_1 = require("../../errors");
const utils_1 = require("../../../utils");
let ElrondNodeService = class ElrondNodeService extends http_service_1.HttpService {
    constructor() {
        super();
        this.config = config_1.elrondConfig.gateway;
    }
    async sendTransaction(signedData) {
        var _a;
        const response = await this.post('transaction/send', signedData);
        if (((_a = response.data) === null || _a === void 0 ? void 0 : _a.code) !== erd_response_code_1.ErdResponseCode.successful) {
            throw errors_1.InternalServerError.fromError({
                message: response.data.error,
                error: utils_1.ErrorCodes.somethingWentWrong,
            });
        }
        return response.data.data;
    }
};
ElrondNodeService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [])
], ElrondNodeService);
exports.ElrondNodeService = ElrondNodeService;
//# sourceMappingURL=elrond-node.service.js.map