"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
const common_1 = require("@nestjs/common");
class NotFoundError extends common_1.NotFoundException {
    static fromError({ message, error }) {
        return new NotFoundError({
            message,
            error,
            statusCode: common_1.HttpStatus.NOT_FOUND,
        });
    }
}
exports.NotFoundError = NotFoundError;
//# sourceMappingURL=not-found-error.js.map