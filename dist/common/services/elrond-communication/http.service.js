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
exports.HttpService = void 0;
const axios_1 = require("axios");
const axiosRetry = require('axios-retry');
const common_1 = require("@nestjs/common");
const errors_1 = require("../../errors");
const utils_1 = require("../../../utils");
let HttpService = class HttpService {
    constructor() {
        this.setup();
    }
    setup() {
        this.httpService = axios_1.default.create();
        axiosRetry(this.httpService, {
            retries: 3,
            retryDelay: (retryCount) => {
                return retryCount * 500;
            },
        });
    }
    get(url, config) {
        return this.httpService.get(url, this.configWithURL(config));
    }
    head(url, config) {
        return this.httpService.head(url, this.configWithURL(config));
    }
    post(url, data, config) {
        return this.httpService.post(url, data, this.configWithURL(config));
    }
    configWithURL(config) {
        var _a, _b;
        const networkUrl = this.config;
        const baseURL = (_b = (_a = config === null || config === void 0 ? void 0 : config.baseURL) !== null && _a !== void 0 ? _a : networkUrl) !== null && _b !== void 0 ? _b : this.url;
        if (!baseURL) {
            throw errors_1.InternalServerError.fromError({
                message: 'Base URL is not set for request',
                error: utils_1.Generic.notConfigured,
            });
        }
        return Object.assign(Object.assign({}, config), { baseURL });
    }
};
HttpService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [])
], HttpService);
exports.HttpService = HttpService;
//# sourceMappingURL=http.service.js.map