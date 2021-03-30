"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("./express");
class Main {
    constructor() {
        this.main().catch((error) => console.log(error));
    }
    async main() {
        const express = new express_1.Express();
        await express.init();
        await express.listen(process.env.PORT);
        console.log('Server is running at PORT: %s', process.env.PORT);
    }
}
new Main();
//# sourceMappingURL=main.js.map