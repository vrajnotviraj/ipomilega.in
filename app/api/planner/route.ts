import { NextResponse } from 'next/server';
import { parsePlanInputs } from '@/lib/ipo/planner/inputs';
import { getPlan } from '@/lib/queries/planner';

/** The best IPO plan for the posted inputs; the same inputs on the same IPO facts are answered from a day-long cache. */
export async function POST(request: Request) {
  const inputs = parsePlanInputs(await request.json().catch(() => null));
  if (!inputs) return NextResponse.json({ message: 'Invalid planner inputs', success: false }, { status: 400 });

  try {
    return NextResponse.json(await getPlan(inputs));
  } catch (error) {
    console.error('Error in /api/planner:', error);
    return NextResponse.json({ message: 'Something went wrong', success: false }, { status: 500 });
  }
}
