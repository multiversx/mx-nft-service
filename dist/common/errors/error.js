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
exports.Error = void 0;
const swagger_1 = require("@nestjs/swagger");
const errors_1 = require("./errors");
class Error {
}
__decorate([
    swagger_1.ApiProperty({
        name: 'error',
        description: 'The error codes. It should be one from /utils/errors.ts',
        enum: Object.assign({}, errors_1.Generic),
    }),
    __metadata("design:type", String)
], Error.prototype, "error", void 0);
__decorate([
    swagger_1.ApiProperty({
        description: 'Message describing the error',
    }),
    __metadata("design:type", String)
], Error.prototype, "message", void 0);
exports.Error = Error;
//# sourceMappingURL=error.js.map