export const JWT_CONFIG = {
	name: "jwt",
	secret: process.env.JWT_SECRET || "your-secret-key",
	exp: "7d",
};
