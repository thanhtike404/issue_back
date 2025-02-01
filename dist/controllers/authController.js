"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Check if the email already exists
        const existingUser = yield prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ error: 'Email already in use' });
            return;
        }
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
        // Create the user in the database
        const user = yield prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });
        res.status(201).json({ msg: 'User registered successfully', user });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const match = yield bcrypt_1.default.compare(password, user.password);
        if (!match) {
            res.status(401).json({ error: 'Incorrect password' });
            return;
        }
        if (!process.env.TOKEN_SECRET) {
            res.status(500).json({
                error: 'Token secret is not set in the environment variables',
            });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.TOKEN_SECRET);
        res.json({ msg: 'Login successful', token });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.login = login;
// const verifyToken = async (req, res, next) => {
//   const token = req.headers.authorization;
//   if (!token) {
//     return res.status(401).json({ error: 'Access denied' });
//   }
//   try {
//     const [type, tokenStr] = token.split(' ');
//     if (type !== 'Bearer' || !tokenStr) {
//       return res.status(401).json({ error: 'Unauthorized request' });
//     }
//     const verifiedUser = jwt.verify(tokenStr, process.env.TOKEN_SECRET);
//     if (!verifiedUser) {
//       return res.status(401).json({ error: 'Unauthorized request' });
//     }
//     req.user = verifiedUser; // Attach the user payload to the request
//     next();
//   } catch (error) {
//     return res.status(401).json({ error: 'Invalid token' });
//   }
// };
// // Routes
// app.get('/protected', verifyToken, async (req, res) => {
//   try {
//     const user = await prisma.admin.findUnique({
//       where: { id: req.user.id },
//     });
//     if (user.isPremium) {
//       return res.json({ msg: 'You are a premium user' });
//     } else {
//       return res.json({ msg: 'You are not a premium user' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });
// app.get('/users', verifyToken, async (req, res) => {
//   try {
//     const user = await prisma.admin.findUnique({
//       where: { id: req.user.id },
//     });
//     res.json({ msg: 'Success', user });
//   } catch (error) {
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });
