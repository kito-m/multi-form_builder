import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET() {
  try {
    const forms = await prisma.form.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forms' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, sections } = body;

    const form = await prisma.form.create({
      data: {
        title,
        description,
        sections: {
          create: sections.map((section: any) => ({
            title: section.title,
            order: section.order,
            fields: {
              create: section.fields.map((field: any) => ({
                label: field.label,
                type: field.type,
                required: field.required,
                order: field.order
              }))
            }
          }))
        }
      },
      include: {
        sections: {
          include: {
            fields: true
          }
        }
      }
    });

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json(
      { error: 'Failed to create form' },
      { status: 500 }
    );
  }
}