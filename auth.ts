import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { PrismaClient } from "./src/generated/prisma";

const prisma = new PrismaClient({
	datasources: {
		db: {
			url: process.env.DATABASE_URL || "",
		},
	},
});

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	user: {
		additionalFields: {
			generationsUsed: {
				type: "number",
				input: false,
			},
			lastResetDate: {
				type: "date",
				input: false,
			},
			freeGenerationsUsed: {
				type: "number",
				input: false,
			},
		},
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		},
	},
	plugins: [inferAdditionalFields()],
});

export type Session = typeof auth.$Infer.Session;
