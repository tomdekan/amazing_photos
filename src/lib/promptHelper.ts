import type { TrainingRecord } from "./db";

export const enhancePrompt = (
	prompt: string,
	trainingRecord: TrainingRecord,
) => {
	return prompt.replace("TOK", `${trainingRecord.sex} TOK`);
};
