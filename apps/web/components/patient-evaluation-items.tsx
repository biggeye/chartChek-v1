// components/dynamicForms/patientEvaluations/PatientEvaluationItems.tsx
import React from 'react';
import { CalendarDays, CheckCircle, XCircle, Info, CircleDot, SquareCheckBig, Square } from 'lucide-react';

// Helper function to safely extract nested content
export function extractContent(item: any): string | null {
  if (item.records?.length && item.records[0]?.description) {
    return item.records[0].description;
  }
  return item.description || item.value || null;
}

// Reusable Label Component
const FieldLabel = ({ label, description }: { label: string; description?: string }) => (
  <div>
    <div className="text-sm font-semibold text-gray-800 flex items-center gap-1">
      <Info className="h-4 w-4 text-indigo-400" /> {label}
    </div>
    {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
  </div>
);

// Styled "N/A" helper
const NA = () => <span className="text-red-500 italic">N/A</span>;

// TextField Component
const TextField = (item: any) => {
  const content = extractContent(item);

  return (
    <div className="p-2 bg-gray-50 rounded-lg shadow-sm space-y-2">
      <FieldLabel label={item.label} description={item.description} />
      {content ? (
        <div className="prose text-gray-700" dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <NA />
      )}
    </div>
  );
};

// Boolean Field (Checkbox single boolean)
const BooleanField = (item: any) => {
  const content = extractContent(item)?.toLowerCase();
  const value = content === 'yes' ? true : content === 'no' ? false : null;

  return (
    <div className="p-2 bg-gray-50 rounded-lg shadow-sm flex justify-between items-center">
      <FieldLabel label={item.label} description={item.description} />
      {value === true ? (
        <CheckCircle className="h-6 w-6 text-green-500" />
      ) : value === false ? (
        <XCircle className="h-6 w-6 text-red-400" />
      ) : (
        <NA />
      )}
    </div>
  );
};

// Date Field with Formatting
const DateField = (item: any) => {
  const content = extractContent(item);
  const formattedDate = content
    ? new Date(content).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div className="p-2 bg-gray-50 rounded-lg shadow-sm flex items-center gap-3">
      <CalendarDays className="text-indigo-400 h-6 w-6" />
      <div>
        <FieldLabel label={item.label} description={item.description} />
        <div className="mt-1 text-gray-700">{formattedDate || <NA />}</div>
      </div>
    </div>
  );
};

// JSON Object Display Component
const ObjectField = (item: any) => {
  const content = extractContent(item);

  return (
    <div className="p-2 bg-gray-800 rounded-lg text-white shadow-sm space-y-2">
      <FieldLabel label={item.label} description={item.description} />
      {content ? (
        <pre className="mt-2 bg-gray-900 p-3 rounded-md overflow-auto text-xs font-mono">
          {JSON.stringify(JSON.parse(content), null, 2)}
        </pre>
      ) : (
        <NA />
      )}
    </div>
  );
};

// Default Component for Unknown Types
const DefaultField = (item: any) => {
  const content = extractContent(item);

  return (
    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm space-y-2">
      <FieldLabel label={`${item.label} (${item.field_type})`} description={item.description} />
      <div className="text-yellow-700">
        {content ? (typeof content === 'object' ? JSON.stringify(content, null, 2) : content) : <NA />}
      </div>
    </div>
  );
};

// Title Component
const TitleField = (item: any) => (
  <h2 className="text-xl font-bold text-center text-indigo-700 border-b pb-1 my-4" dangerouslySetInnerHTML={{ __html: item.label }} />
);

// RadioButtons Component
const RadioButtonsField = (item: any) => {
  const options = item.records?.[0]?.record_items;
  if (!options) return <DefaultField {...item} />;

  return (
    <div className="p-2 bg-gray-50 rounded-lg shadow-sm space-y-2">
      <FieldLabel label={item.label} description={item.description} />
      <div className="space-y-1">
        {options.map((option: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2">
            {option.value ? (
              <CircleDot className="h-4 w-4 text-indigo-500" />
            ) : (
              <CircleDot className="h-4 w-4 text-gray-300" />
            )}
            <span className={option.value ? "text-gray-800 font-medium" : "text-gray-500"}>
              {option.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Correct CheckboxGroupField Component
const CheckboxGroupField = (item: any) => {
  const options = item.records;
  if (!options || !Array.isArray(options)) return <DefaultField {...item} />;

  return (
    <div className="p-2 bg-gray-50 rounded-lg shadow-sm space-y-2">
      <FieldLabel label={item.label} description={item.description} />
      <div className="space-y-1">
        {options.map((option: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2">
            {option.value ? (
              <SquareCheckBig className="h-4 w-4 text-green-500" />
            ) : (
              <Square className="h-4 w-4 text-gray-300" />
            )}
            <span className={option.value ? "text-gray-800 font-medium" : "text-gray-500"}>
              {option.label}
            </span>
            {option.description && option.description !== 'n/a' && (
              <span className="ml-2 text-xs italic text-gray-400">
                ({option.description})
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
// Enhanced MatrixField Component
export const MatrixField = ({ item, previousAnswerYes }: { item: any; previousAnswerYes: boolean }) => {
  if (!previousAnswerYes) return null;

  const records = item.records;
  if (!records || !Array.isArray(records) || records.length === 0) return null;

  const columnHeaders = records[0].column_names.map((col: any) => col.key);

  return (
    <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3">
      <FieldLabel label={item.label} description={item.description} />
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-indigo-50">
            {columnHeaders.map((header: string, idx: number) => (
              <th key={idx} className="px-3 py-2 text-sm font-semibold text-left text-indigo-800 border-b">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record: any, rowIndex: number) => (
            <tr key={rowIndex} className="border-t">
              {record.column_names.map((col: any, colIndex: number) => (
                <td key={colIndex} className="px-3 py-2 text-sm text-gray-700 border-b">
                  {col.value || <span className="text-red-500 italic">N/A</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


// Field-type to component mapping
export const evaluationFieldComponents: Record<string, React.ComponentType<any>> = {
  text: TextField,
  textarea: TextField,
  number: TextField,
  select: TextField,
  checkbox: CheckboxGroupField,
  check_box: CheckboxGroupField,
  check_box_first_value_none: CheckboxGroupField,  // specifically your provided example
  radio_buttons: RadioButtonsField,
  radio: RadioButtonsField,
  date: DateField,
  datetime: DateField,
  evaluation_datetime: DateField,
  object: ObjectField,
  title: TitleField,
  default: DefaultField,
  string: TextField
};

export const enumeratedFieldTypes = Object.keys(evaluationFieldComponents);

// Utility function to fetch component by field type
export const getFieldComponent = (fieldType: string) => {
  return evaluationFieldComponents[fieldType] || DefaultField;
};