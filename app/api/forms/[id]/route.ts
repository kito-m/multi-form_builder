import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const form = await prisma.form.findUnique({
      where: {
        id: params.id
      },
      include: {
        sections: {
          orderBy: {
            order: 'asc'
          },
          include: {
            fields: {
              orderBy: {
                order: 'asc'
              }
            }
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

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    );
  }
}