import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { planName, denialReason, denialDate, serviceDescription, denialCode, planType, immigrationStatus, state } = await req.json()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are an expert health insurance appeals specialist. Analyze this denial and respond ONLY with JSON.

Plan/Insurer: ${planName}
Service denied: ${serviceDescription}
Denial date: ${denialDate}
Denial reason: ${denialReason}
${denialCode ? `Denial code: ${denialCode}` : ''}
Plan type: ${planType ?? 'unknown'}
User state: ${state ?? 'unknown'}
User immigration status: ${immigrationStatus ?? 'unknown'}

${immigrationStatus && !['us_citizen', 'green_card'].includes(immigrationStatus)
  ? 'Note: This user is on a non-ACA plan. Appeal rights may differ from ACA plans — focus on the plan\'s own appeals process and any applicable state laws.'
  : 'This is likely an ACA-compliant plan. Standard ACA appeal rights and timelines apply.'}

Respond ONLY with this JSON structure, no markdown:
{
  "denialType": "string — e.g. Prior Authorization Required, Medical Necessity, Out-of-Network, Coding Error, Benefit Exclusion",
  "appealableIssues": ["2-4 specific issues that can be contested"],
  "recommendedApproach": "1-2 sentence strategy",
  "successLikelihood": "high or medium or low",
  "supportingDocuments": ["3-5 documents to gather"],
  "keyArguments": ["3-5 specific legal or medical arguments to make"]
}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    let analysis
    try {
      analysis = JSON.parse(text.trim())
    } catch {
      // Claude may have wrapped in markdown — strip it
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      try {
        analysis = JSON.parse(cleaned)
      } catch {
        // Return a safe default so the user still gets something useful
        analysis = {
          denialType: 'Unable to parse denial type',
          appealableIssues: ['Request the specific reason for denial in writing', 'Ask for the clinical criteria used'],
          recommendedApproach: 'File a formal written appeal citing your right to a full and fair review under the ACA.',
          successLikelihood: 'medium',
          supportingDocuments: ['Letter of medical necessity from your doctor', 'Relevant medical records', 'Copy of the denial letter'],
          keyArguments: ['You have the right to appeal any denial', 'Request the specific clinical criteria used', 'Ask for an independent external review if internal appeal fails'],
        }
      }
    }
    return NextResponse.json(analysis)
  } catch (err) {
    console.error('Appeal analyze error:', err)
    return NextResponse.json({ error: 'Failed to analyze denial' }, { status: 500 })
  }
}
