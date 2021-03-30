"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequest = void 0;
const common_1 = require("@nestjs/common");
class BadRequest extends common_1.BadRequestException {
    static fromError({ message, error }) {
        return new BadRequest({
            message,
            error,
            statusCode: common_1.HttpStatus.BAD_REQUEST,
        });
    }
}
exports.BadRequest = BadRequest;
//# sourceMappingURL=bad-request.js.map