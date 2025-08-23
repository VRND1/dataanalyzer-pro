import { useState, useEffect } from 'react';
import { TrendingUp, Plus, Trash2 } from 'lucide-react';

interface DataField {
  name: string;
  value: number | string;
  type: 'number' | 'text';
}

interface DataInputProps {
  initialData?: DataField[];
  onDataChange: (data: DataField[]) => void;
}

export default function DataInput({ initialData = [], onDataChange }: DataInputProps) {
  const [fields, setFields] = useState<DataField[]>(initialData);

  useEffect(() => {
    onDataChange(fields);
  }, [fields, onDataChange]);

  const handleFieldChange = (index: number, field: Partial<DataField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...field };
    setFields(newFields);
  };

  const addField = () => {
    setFields([...fields, { name: '', value: '', type: 'number' }]);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-indigo-600" />
          <h2 className="text-xl font-semibold">Data Input</h2>
        </div>
        <button
          onClick={addField}
          className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus size={16} />
          Add Field
        </button>
      </div>
      
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={field.name}
                onChange={(e) => handleFieldChange(index, { name: e.target.value })}
                placeholder="Field name"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => handleFieldChange(index, { value: e.target.value })}
                placeholder="Value"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <select
              value={field.type}
              onChange={(e) => handleFieldChange(index, { type: e.target.value as 'number' | 'text' })}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="number">Number</option>
              <option value="text">Text</option>
            </select>
            <button
              onClick={() => removeField(index)}
              className="p-2 text-red-600 hover:text-red-700"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}