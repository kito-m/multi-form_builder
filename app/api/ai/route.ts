import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a form builder assistant. Generate a form structure based on the user's prompt. Return ONLY valid JSON in this exact format:
{
  "title": "Form Title",
  "description": "Form Description",
  "sections": [
    {
      "title": "Section Title",
      "fields": [
        {
          "label": "Field Label",
          "type": "text|number",
          "required": true|false
        }
      ]
    }
  ]
}

Rules:
- Maximum 2 sections
- Maximum 3 fields per section
- Field types must be either "text" or "number" (lowercase)
- Make fields required based on their importance
- Create practical, relevant field labels`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response
    let generated;
    try {
      generated = JSON.parse(content);
    } catch (error) {
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate the structure
    if (!generated.sections || !Array.isArray(generated.sections)) {
      throw new Error('Invalid form structure from OpenAI');
    }

    // Ensure we have at most 2 sections and 3 fields per section
    generated.sections = generated.sections.slice(0, 2);
    generated.sections.forEach((section: any) => {
      if (section.fields && Array.isArray(section.fields)) {
        section.fields = section.fields.slice(0, 3);
      }
    });

    return NextResponse.json(generated);
  } catch (error) {
    console.error('Error generating form:', error);
    return NextResponse.json(
      { error: 'Failed to generate form. Please try again.' },
      { status: 500 }
    );
  }
}