import { DataField } from '@/types/data';
import { MessageSquare, Hash, Tag } from 'lucide-react';

interface TextFieldCardProps {
  field: DataField;
}

export function TextFieldCard({ field }: TextFieldCardProps) {
  const values = field.value as string[];
  const uniqueValues = new Set(values);
  const avgLength = values.reduce((sum, val) => sum + val.length, 0) / values.length;
  const maxLength = Math.max(...values.map(v => v.length));
  const minLength = Math.min(...values.map(v => v.length));

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-black">{field.name}</h3>
      </div>

      <div className="space-y-4">
        {/* Basic Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Unique Values</p>
              <p className="font-medium text-black">{uniqueValues.size}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Total Values</p>
              <p className="font-medium text-black">{values.length}</p>
            </div>
          </div>
        </div>

        {/* Length Stats */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Text Length Statistics</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Average</p>
              <p className="font-medium text-black">{avgLength.toFixed(1)} chars</p>
            </div>
            <div>
              <p className="text-gray-500">Min</p>
              <p className="font-medium text-black">{minLength} chars</p>
            </div>
            <div>
              <p className="text-gray-500">Max</p>
              <p className="font-medium text-black">{maxLength} chars</p>
            </div>
          </div>
        </div>

        {/* Sample Values */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Sample Values
          </h4>
          <div className="space-y-1">
            {values.slice(0, 3).map((value, index) => (
              <p key={index} className="text-sm text-black-600 truncate">
                {value}
              </p>
            ))}
            {values.length > 3 && (
              <p className="text-sm text-gray-500">
                +{values.length - 3} more values
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}