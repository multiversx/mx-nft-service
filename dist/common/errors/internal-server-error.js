"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = void 0;
const common_1 = require("@nestjs/common");
class InternalServerError extends common_1.InternalServerErrorException {
    static fromError({ message, error }) {
        return new InternalServerError({
            message,
            error,
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        });
    }
}
exports.InternalServerError = InternalServerError;
//# sourceMappingURL=internal-server-error.js.map