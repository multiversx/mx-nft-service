"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = void 0;
const common_1 = require("@nestjs/common");
class UnauthorizedError extends common_1.UnauthorizedException {
    static fromError({ message, error }) {
        return new UnauthorizedError({
            message,
            error,
            statusCode: common_1.HttpStatus.UNAUTHORIZED,
        });
    }
}
exports.UnauthorizedError = UnauthorizedError;
//# sourceMappingURL=unauthorized-error.js.map