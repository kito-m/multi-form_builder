import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { checkAuth } from '../../../lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const form = await prisma.form.findUnique({
      where: {
        id: id
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication for updating forms
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, sections } = body;

    // First, delete existing sections and fields
    await prisma.section.deleteMany({
      where: { formId: id }
    });

    // Update form with new data
    const updatedForm = await prisma.form.update({
      where: { id },
      data: {
        title,
        description,
        sections: {
          create: sections.map((section: { title: string; order: number; fields: { label: string; type: string; required: boolean; order: number }[] }) => ({
            title: section.title,
            order: section.order,
            fields: {
              create: section.fields.map((field: { label: string; type: string; required: boolean; order: number }) => ({
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

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication for deleting forms
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    // Check if form exists
    const form = await prisma.form.findUnique({
      where: { id }
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    // Delete form (cascade will handle sections, fields, submissions, responses)
    await prisma.form.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Form deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    );
  }
}