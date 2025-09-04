'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

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

export default function EditForm({ params }: { params: Promise<{ id: string }> }) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    sections: []
  });
  const [formId, setFormId] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      
      if (!data.authenticated) {
        router.push('/login');
        return;
      }
      
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login');
    }
  }, [router]);

  const fetchForm = useCallback(async (id: string) => {
    if (!id) return;
    
    try {
      const response = await fetch(`/api/forms/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/admin');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const form = await response.json();
      setFormData({
        title: form.title,
        description: form.description || '',
        sections: form.sections.map((section: { id: string; title: string; order: number; fields: { id: string; label: string; type: string; required: boolean; order: number }[] }) => ({
          id: section.id,
          title: section.title,
          order: section.order,
          fields: section.fields.map((field: { id: string; label: string; type: string; required: boolean; order: number }) => ({
            id: field.id,
            label: field.label,
            type: field.type,
            required: field.required,
            order: field.order
          }))
        }))
      });
    } catch (error) {
      console.error('Error fetching form:', error);
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const initializeForm = async () => {
      try {
        const resolvedParams = await params;
        setFormId(resolvedParams.id);
        await checkAuth();
        await fetchForm(resolvedParams.id);
      } catch (error) {
        console.error('Error initializing form:', error);
        setLoading(false);
      }
    };
    
    initializeForm();
  }, [params, checkAuth, fetchForm]);

  const addSection = () => {
    if (formData.sections.length >= 2) {
      alert('Maximum 2 sections allowed');
      return;
    }

    const newSection: Section = {
      id: uuidv4(),
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
    if (!section) return;

    if (section.fields.length >= 3) {
      alert('Maximum 3 fields per section allowed');
      return;
    }

    const newField: Field = {
      id: uuidv4(),
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
      const response = await fetch('/api/ai', {
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
      const sections: Section[] = generated.sections.map((section: { title: string; fields: { label: string; type: string; required?: boolean }[] }, index: number) => ({
        id: uuidv4(),
        title: section.title,
        order: index,
        fields: section.fields.map((field: { label: string; type: string; required?: boolean }, fieldIndex: number) => ({
          id: uuidv4(),
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
        sections: sections
      }));

      setAiPrompt('');
    } catch (error) {
      console.error('Error generating form:', error);
      alert('Failed to generate form. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a form title');
      return;
    }

    if (formData.sections.length === 0) {
      alert('Please add at least one section');
      return;
    }

    for (const section of formData.sections) {
      if (!section.title.trim()) {
        alert('Please enter a title for all sections');
        return;
      }
      if (section.fields.length === 0) {
        alert('Please add at least one field to each section');
        return;
      }
      for (const field of section.fields) {
        if (!field.label.trim()) {
          alert('Please enter a label for all fields');
          return;
        }
      }
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update form');
      }

      router.push('/admin');
    } catch (error) {
      console.error('Error updating form:', error);
      alert('Failed to update form. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit Form</h1>
            <Link
              href="/admin"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* AI Generation Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Form Generation (Optional)</h2>
            <div className="mb-4">
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe the form you want to create (e.g., 'Contact form with name, email, and message fields')"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>
            <button
              onClick={generateWithAI}
              disabled={isGenerating || !aiPrompt.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>

          {/* Form Builder */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Form Details</h2>
            
            {/* Form Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Title *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter form title"
              />
            </div>

            {/* Form Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Description (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  Add Section
                </button>
              </div>

              {formData.sections.map((section) => (
                <div key={section.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={section.title}
                      onChange={(e) => updateSection(section.id, e.target.value)}
                      placeholder="Section title"
                    />
                    <button
                      onClick={() => removeSection(section.id)}
                      className="ml-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Remove Section
                    </button>
                  </div>

                  <div className="ml-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-md font-medium text-gray-700">Fields</h4>
                      <button
                        onClick={() => addField(section.id)}
                        disabled={section.fields.length >= 3}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                      >
                        Add Field
                      </button>
                    </div>

                    {section.fields.map((field) => (
                      <div key={field.id} className="border border-gray-100 rounded p-3 mb-2">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            className="col-span-4 px-2 py-1 border border-gray-300 rounded text-sm"
                            value={field.label}
                            onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                            placeholder="Field label"
                          />
                          <select
                            className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm"
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
                            className="col-span-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Update Form'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}