interface ICorsConfig {
	origin: string | string[];
	methods: string[];
	allowedHeaders: string[];
	credentials: boolean;
	maxAge: number;
	// exposeHeaders?: string[];
}

export const CORSConfig: ICorsConfig = {
	origin: process.env.ALLOWED_HOST ? process.env.ALLOWED_HOST.split(",") : "*",
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: false,
	maxAge: 86400,
	// exposeHeaders: [],
};
