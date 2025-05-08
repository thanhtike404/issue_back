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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketAuthService = void 0;
class SocketAuthService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    authenticate(socket, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = socket.handshake.auth.userId;
            if (!userId) {
                return next(new Error("Authentication error"));
            }
            try {
                const user = yield this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { id: true, role: true, name: true }
                });
                if (!user) {
                    return next(new Error("User not found"));
                }
                socket.data.user = user;
                next();
            }
            catch (error) {
                console.error('Authentication error:', error);
                next(new Error("Authentication error"));
            }
        });
    }
}
exports.SocketAuthService = SocketAuthService;
