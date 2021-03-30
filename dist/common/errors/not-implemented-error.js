"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotImplementedError = void 0;
const common_1 = require("@nestjs/common");
class NotImplementedError extends common_1.NotImplementedException {
    static fromError({ message, error }) {
        return new NotImplementedError({
            message,
            error,
            statusCode: common_1.HttpStatus.NOT_IMPLEMENTED,
        });
    }
}
exports.NotImplementedError = NotImplementedError;
//# sourceMappingURL=not-implemented-error.js.map