// Excellent starter prompts for automatic generation after training completes
export const STARTER_PROMPTS = [
  "a professional headshot of TOK in a modern office setting, soft lighting, corporate style",
  "TOK as a superhero flying through the sky, cape flowing, dramatic lighting, comic book style",
  "a portrait of TOK in Renaissance style, oil painting, classical lighting, ornate background",
  "TOK sitting in a cozy coffee shop, casual clothes, warm lighting, candid moment",
  "TOK as a space explorer on an alien planet, futuristic suit, sci-fi environment",
  "a black and white artistic portrait of TOK, dramatic shadows, film noir style",
  "TOK as a medieval knight in shining armor, castle background, epic fantasy style",
  "TOK in a beautiful garden during golden hour, natural lighting, peaceful atmosphere",
  "TOK as a detective in 1940s style, trench coat, foggy street, vintage aesthetic",
  "a cyberpunk portrait of TOK with neon lights, futuristic cityscape background",
  "TOK as a pirate captain on a ship deck, ocean waves, adventure style",
  "TOK in elegant formal wear at a gala, luxurious ballroom setting, sophisticated lighting",
  "TOK as a wise wizard with magical elements, mystical forest background, fantasy style",
  "a candid photo of TOK laughing, natural expression, soft outdoor lighting",
  "TOK as an astronaut floating in space, Earth in background, cinematic space scene"
]

export function getStarterPrompts(): string[] {
  return [...STARTER_PROMPTS]
}

export function getRandomStarterPrompts(count: number): string[] {
  const shuffled = [...STARTER_PROMPTS].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, STARTER_PROMPTS.length))
} 