import "dotenv/config";
declare global {
    namespace Express {
        interface Request {
            email: string;
            password: string;
            userId?: number;
        }
    }
}
//# sourceMappingURL=index.d.ts.map