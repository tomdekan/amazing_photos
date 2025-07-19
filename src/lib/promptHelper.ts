import type { TrainingRecord } from "./db";

export const enhancePrompt = (
	prompt: string,
	trainingRecord: TrainingRecord,
) => {
	return [
		`Produce an extremely high quality image where TOK is the subject.`,
		`TOK is a ${trainingRecord.sex} person`,
		prompt,
	].join(".");
};
