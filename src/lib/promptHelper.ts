
export const enhancePrompt = (
	prompt: string,
	sex: string,
) => {
	return prompt.replace("TOK", `${sex} TOK`);
};
