"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Express = void 0;
const env_load_1 = require("./config/env_load");
env_load_1.envload();
const bodyParser = require("body-parser");
const errorHandler = require("errorhandler");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const helmet = require("helmet");
const common_1 = require("@nestjs/common");
const passport = require("passport");
class Express {
    async init() {
        var _a;
        const app = (this.app = await core_1.NestFactory.create(app_module_1.AppModule));
        app.disable('x-powered-by');
        app.enable('trust-proxy');
        const corsOrigin = (_a = process.env.CORS_ORIGINS.split(',').map((item) => new RegExp(item))) !== null && _a !== void 0 ? _a : [];
        app.enableCors({
            origin: corsOrigin,
        });
        if (process.env.NODE_ENV !== 'production') {
            const options = new swagger_1.DocumentBuilder()
                .setTitle('Elrond NTF API')
                .setDescription('')
                .setVersion('1.0')
                .build();
            const document = swagger_1.SwaggerModule.createDocument(app, options);
            swagger_1.SwaggerModule.setup('api-docs', app, document);
        }
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use('/metrics', (req, res, next) => {
            const authorizationHeader = req.headers.authorization;
            if (authorizationHeader == undefined) {
                next();
                return;
            }
            const apiKeyMatch = authorizationHeader.match(/Bearer (.*)/);
            if (apiKeyMatch.length != 2) {
                next();
                return;
            }
            const apiKey = apiKeyMatch[1];
            if (apiKey) {
                req.headers = Object.assign(Object.assign({}, req.headers), { 'x-api-key': apiKey });
            }
            next();
        }, passport.authenticate('headerapikey', { session: false }));
        app.use(errorHandler());
        app.use(helmet());
        app.useGlobalPipes(new common_1.ValidationPipe());
        await app.startAllMicroservicesAsync();
    }
    getExpressApp() {
        return this.app;
    }
    listen(port) {
        return new Promise((res) => {
            this.server = this.app.listen(port, res);
        });
    }
}
exports.Express = Express;
//# sourceMappingURL=express.js.map