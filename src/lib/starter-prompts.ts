import { Prompt } from "../generated/prisma"
import { prisma } from "./db"

export async function getStarterPrompts(sex: string, count: number): Promise<Prompt[]> {
  return await prisma.prompt.findMany({
    where: {
      sex,
      isStarterPrompt: true,
    },
    take: count,
  })
}

export async function getRandomStarterPrompts(count: number, sex: string): Promise<Prompt[]> {
  const prompts = await getStarterPrompts(sex)
  const shuffled = [...prompts].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, prompts.length))
} 