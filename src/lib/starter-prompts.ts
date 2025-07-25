import type { Prompt } from "../generated/prisma";
import { prisma } from "./db";

export async function getStarterPrompts(
	sex: string,
	take: number,
	skip = 0,
): Promise<Prompt[]> {
	return await prisma.prompt.findMany({
		where: {
			sex,
			isStarterPrompt: true,
		},
		orderBy: [{ createdAt: "asc" }, { id: "asc" }],
		take,
		skip,
	});
}

export async function getRandomStarterPrompts(
	count: number,
	sex: string,
): Promise<Prompt[]> {
	const prompts = await getStarterPrompts(sex, count);
	const shuffled = [...prompts].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, Math.min(count, prompts.length));
}
