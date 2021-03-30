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
exports.LoggerInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const nest_winston_1 = require("nest-winston");
const operators_1 = require("rxjs/internal/operators");
const random_string_generator_util_1 = require("@nestjs/common/utils/random-string-generator.util");
let LoggerInterceptor = class LoggerInterceptor {
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const platformHeader = request.headers['x-platform'];
        const versionHeader = request.headers['x-version'];
        this.logger.defaultMeta = {
            tag: random_string_generator_util_1.randomStringGenerator(),
            platform: platformHeader,
            appVersion: versionHeader,
        };
        return next.handle().pipe(operators_1.tap(() => setTimeout(() => {
            this.logHttp(context);
        }, 0)), operators_1.catchError((err) => {
            if (!err.status || err.status === 500) {
                setTimeout(() => {
                    this.logException(err, context);
                }, 0);
            }
            return rxjs_1.throwError(err);
        }));
    }
    logHttp(context) { }
    logException(err, context) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const platformHeader = request.headers['x-platform'];
        const versionHeader = request.headers['x-version'];
        this.logger.error('HTTP_REQUEST', {
            method: request.method,
            url: request.url,
            route: request.route.path,
            user: request.user,
            network: request.networkHeader,
            response: response.statusCode,
            platform: platformHeader,
            appVersion: versionHeader,
            exception: err.toString(),
        });
    }
};
LoggerInterceptor = __decorate([
    common_1.Injectable(),
    __param(0, common_1.Inject(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], LoggerInterceptor);
exports.LoggerInterceptor = LoggerInterceptor;
//# sourceMappingURL=logger-interceptor.js.map