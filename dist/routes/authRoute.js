"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authRoutes = (0, express_1.Router)();
authRoutes.route('/register').post(authController_1.register);
authRoutes.route('/login').post(authController_1.login);
exports.default = authRoutes;
