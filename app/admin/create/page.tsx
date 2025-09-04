'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Field {
  id: string;
  label: string;
  type: 'TEXT' | 'NUMBER';
  required: boolean;
  order: number;
}

interface Section {
  id: string;
  title: string;
  order: number;
  fields: Field[];
}

interface FormData {
  title: string;
  description: string;
  sections: Section[];
}

export default function CreateForm() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    sections: []
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('isAdmin')) {
      router.push('/');
      return;
    }
  }, [router]);

  const addSection = () => {
    if (formData.sections.length >= 2) {
      alert('Maximum 2 sections allowed');
      return;
    }

    const newSection: Section = {
      id: `section_${Date.now()}`,
      title: '',
      order: formData.sections.length,
      fields: []
    };

    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const removeSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }));
  };

  const updateSection = (sectionId: string, title: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, title } : s
      )
    }));
  };

  const addField = (sectionId: string) => {
    const section = formData.sections.find(s => s.id === sectionId);
    if (section && section.fields.length >= 3) {
      alert('Maximum 3 fields per section allowed');
      return;
    }

    const newField: Field = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'TEXT',
      required: false,
      order: section?.fields.length || 0
    };

    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId 
          ? { ...s, fields: [...s.fields, newField] }
          : s
      )
    }));
  };

  const removeField = (sectionId: string, fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) }
          : s
      )
    }));
  };

  const updateField = (sectionId: string, fieldId: string, updates: Partial<Field>) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map(f =>
                f.id === fieldId ? { ...f, ...updates } : f
              )
            }
          : s
      )
    }));
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter a prompt for AI generation');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate form');
      }

      const generated = await response.json();
      
      // Convert generated structure to our format
      const sections: Section[] = generated.sections.map((section: any, index: number) => ({
        id: `section_${Date.now()}_${index}`,
        title: section.title,
        order: index,
        fields: section.fields.map((field: any, fieldIndex: number) => ({
          id: `field_${Date.now()}_${index}_${fieldIndex}`,
          label: field.label,
          type: field.type.toUpperCase() as 'TEXT' | 'NUMBER',
          required: field.required || false,
          order: fieldIndex
        }))
      }));

      setFormData(prev => ({
        ...prev,
        title: generated.title || prev.title,
        description: generated.description || prev.description,
        sections
      }));
    } catch (error) {
      console.error('Error generating form:', error);
      alert('Failed to generate form. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveForm = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a form title');
      return;
    }

    if (formData.sections.length === 0) {
      alert('Please add at least one section');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save form');
      }

      const result = await response.json();
      alert(`Form saved successfully! Public URL: ${window.location.origin}/form/${result.id}`);
      router.push('/admin');
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Failed to save form. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Create New Form</h1>
            <div className="flex space-x-4">
              <Link
                href="/admin"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          {/* AI Generation Section */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI Form Generation (Optional)</h3>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="e.g., A job application form"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button
                onClick={generateWithAI}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
          </div>

          {/* Form Basic Info */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Form Title</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter form title"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter form description"
            />
          </div>

          {/* Sections */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Sections</h3>
              <button
                onClick={addSection}
                disabled={formData.sections.length >= 2}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                Add Section ({formData.sections.length}/2)
              </button>
            </div>

            {formData.sections.map((section) => (
              <div key={section.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="text"
                    placeholder="Section title"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 mr-4"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, e.target.value)}
                  />
                  <button
                    onClick={() => removeSection(section.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove Section
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Fields</h4>
                    <button
                      onClick={() => addField(section.id)}
                      disabled={section.fields.length >= 3}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                    >
                      Add Field ({section.fields.length}/3)
                    </button>
                  </div>

                  {section.fields.map((field) => (
                    <div key={field.id} className="border border-gray-100 rounded p-3 mb-2">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Field label"
                          className="col-span-4 px-2 py-1 border border-gray-300 rounded text-sm"
                          value={field.label}
                          onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                        />
                        <select
                          className="col-span-3 px-2 py-1 border border-gray-300 rounded text-sm"
                          value={field.type}
                          onChange={(e) => updateField(section.id, field.id, { type: e.target.value as 'TEXT' | 'NUMBER' })}
                        >
                          <option value="TEXT">Text</option>
                          <option value="NUMBER">Number</option>
                        </select>
                        <label className="col-span-2 flex items-center text-sm">
                          <input
                            type="checkbox"
                            className="mr-1"
                            checked={field.required}
                            onChange={(e) => updateField(section.id, field.id, { required: e.target.checked })}
                          />
                          Required
                        </label>
                        <button
                          onClick={() => removeField(section.id, field.id)}
                          className="col-span-3 text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  {section.fields.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No fields added yet</p>
                  )}
                </div>
              </div>
            ))}

            {formData.sections.length === 0 && (
              <p className="text-gray-500 text-center py-8">No sections added yet</p>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveForm}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}