import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { responses } = body;

    // First verify the form exists
    const form = await prisma.form.findUnique({
      where: { id: params.id },
      include: {
        sections: {
          include: {
            fields: true
          }
        }
      }
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    // Create the submission with all responses
    const submission = await prisma.submission.create({
      data: {
        formId: params.id,
        responses: {
          create: responses.map((response: any) => ({
            fieldId: response.fieldId,
            value: response.value
          }))
        }
      },
      include: {
        responses: true
      }
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    );
  }
}