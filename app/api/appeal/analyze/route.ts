import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { planName, denialReason, denialDate, serviceDescription, denialCode } = await req.json()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are an expert health insurance appeals specialist with deep knowledge of ACA, ERISA, and state insurance regulations. Analyze this insurance denial and return a structured JSON assessment.

Plan/Insurer: ${planName}
Service denied: ${serviceDescription}
Denial date: ${denialDate}
Denial reason: ${denialReason}
${denialCode ? `Denial code: ${denialCode}` : ''}

Respond ONLY with a JSON object (no markdown fences, no explanation) in this exact format:
{
  "denialType": "string categorizing the denial type, e.g. Prior Authorization Required, Medical Necessity Denial, Out-of-Network, Experimental/Investigational, Coding Error, Benefit Exclusion",
  "appealableIssues": ["specific issues that can be contested, 2-4 items"],
  "recommendedApproach": "1-2 sentence strategy for this appeal",
  "successLikelihood": "high or medium or low",
  "supportingDocuments": ["list of documents to gather, 3-6 items"],
  "keyArguments": ["3-5 specific legal or medical necessity arguments to make in the appeal letter"]
}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const analysis = JSON.parse(text.trim())
    return NextResponse.json(analysis)
  } catch (err) {
    console.error('Appeal analyze error:', err)
    return NextResponse.json({ error: 'Failed to analyze denial' }, { status: 500 })
  }
}
