import type { PlanType } from '@/types'

export const PLAN_INFO: Record<PlanType, { label: string; color: string; description: string; detail: string }> = {
  medicaid: {
    label: 'Medicaid',
    color: 'brand',
    description: 'Free or very low-cost government coverage based on income.',
    detail: 'Medicaid is a joint federal-state program that provides comprehensive health coverage at little or no cost. It covers doctor visits, hospital stays, prescriptions, mental health, and preventive care. There are no premiums in most states and minimal copays.',
  },
  chip: {
    label: 'CHIP',
    color: 'brand',
    description: 'Low-cost coverage for children in families that earn too much for Medicaid.',
    detail: "The Children's Health Insurance Program covers kids up to age 19 in families who earn too much for Medicaid but can't afford private insurance. Premiums and copays are low, and coverage is comprehensive.",
  },
  aca_marketplace: {
    label: 'ACA Marketplace',
    color: 'blue',
    description: 'Subsidized private plans on Healthcare.gov or your state exchange.',
    detail: 'The ACA marketplace offers private health plans that must cover essential health benefits. Plans are categorized as Bronze, Silver, Gold, or Platinum — higher metal tiers mean lower out-of-pocket costs but higher premiums. If your income is 100–400% of the federal poverty level, you may qualify for a Premium Tax Credit to reduce your monthly cost.',
  },
  employer_sponsored: {
    label: 'Employer-sponsored plan',
    color: 'blue',
    description: 'Health coverage through your employer, usually the most cost-effective option.',
    detail: "Employer-sponsored insurance is provided through your job. Your employer typically pays 50–80% of the premium, making it far cheaper than buying coverage on your own. You're generally limited to your employer's chosen plans, but most include comprehensive coverage.",
  },
  school_plan: {
    label: 'University health plan (SHIP)',
    color: 'purple',
    description: 'Student Health Insurance Plan offered directly by your university.',
    detail: "Most US universities offer a Student Health Insurance Plan (SHIP). These are ACA-compliant plans tailored to students — they cover campus health centers and nearby providers. Many schools require proof of insurance and allow you to waive the SHIP if you have comparable coverage elsewhere.",
  },
  international_student_plan: {
    label: 'International student plan (ISP)',
    color: 'purple',
    description: 'Private plans designed specifically for international students.',
    detail: "International Student Plans are private health insurance plans marketed to students on F-1, J-1, and similar visas. They're often cheaper than university SHIPs but may have narrower networks and lower coverage limits. Always verify an ISP meets your school's waiver requirements before choosing it over the SHIP.",
  },
  short_term: {
    label: 'Short-term health plan',
    color: 'amber',
    description: 'Temporary coverage with limited benefits. Use only as a last resort.',
    detail: "Short-term plans fill gaps in coverage for a few months but are not ACA-compliant. They typically exclude pre-existing conditions, mental health, maternity, and preventive care. Premiums are low, but you can face massive out-of-pocket costs if you need serious care. Use only as a bridge — not as a long-term strategy.",
  },
  cobra: {
    label: 'COBRA continuation',
    color: 'amber',
    description: 'Keep your former employer\'s coverage for up to 18 months after leaving a job.',
    detail: "COBRA lets you continue your employer's exact health plan after a job loss, reduced hours, or other qualifying events. Coverage is identical to what you had, including your same doctors and network. The catch: you pay the full premium (what you paid plus what your employer paid) plus a 2% admin fee — which can be expensive. You have 60 days to elect COBRA.",
  },
  medicare: {
    label: 'Medicare',
    color: 'brand',
    description: 'Federal insurance for people 65+ or with qualifying disabilities.',
    detail: 'Medicare is the federal health insurance program for people 65 and older, and for younger people with certain disabilities or End-Stage Renal Disease. It has multiple parts: Part A (hospital), Part B (medical), Part C (Medicare Advantage), and Part D (prescription drugs).',
  },
  va: {
    label: 'VA Healthcare',
    color: 'blue',
    description: 'Healthcare through the Department of Veterans Affairs.',
    detail: 'VA Healthcare provides medical care to eligible veterans through a network of VA medical centers and clinics. Eligibility depends on service history, disability rating, and income. Veterans with service-connected conditions receive priority access.',
  },
  parent_plan: {
    label: "Parent or spouse's plan",
    color: 'blue',
    description: 'Staying on your current dependent coverage — the best option for your situation.',
    detail: "Based on your plan details and profile, remaining on your current dependent coverage is your best option. This is typically the case when the plan is comprehensive, low-cost to you, and you have significant time before aging off. Review this annually and start planning your transition at least 6 months before you turn 26 or lose eligibility.",
  },
  none: {
    label: 'No standard options',
    color: 'red',
    description: 'No standard plans available — but community resources may still help.',
    detail: "Based on your profile, you don't qualify for standard health insurance programs. Community Health Centers (Federally Qualified Health Centers) offer sliding-scale care regardless of immigration status. Emergency Medicaid covers emergency stabilization in most states. Ask your AI navigator for specific resources in your area.",
  },
}
