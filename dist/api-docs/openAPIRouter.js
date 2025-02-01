"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openAPIRouter = void 0;
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const openAPIDocumentGenerator_1 = require("./openAPIDocumentGenerator");
exports.openAPIRouter = express_1.default.Router();
const openAPIDocument = (0, openAPIDocumentGenerator_1.generateOpenAPIDocument)();
exports.openAPIRouter.get('/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openAPIDocument);
});
exports.openAPIRouter.use('/', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openAPIDocument));
