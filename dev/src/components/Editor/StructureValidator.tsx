'use client';

import { Editor } from '@tiptap/react';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateStructure(editor: Editor | null): ValidationResult {
  if (!editor) return { valid: true, errors: [] };

  const errors: string[] = [];
  const json = editor.getJSON();
  const content = json.content || [];

  const headings = content.filter(
    (node) => node.type === 'heading' && node.attrs?.level === 2
  );

  if (headings.length === 0) {
    errors.push('At least one Section (H2) is required');
  }

  const headingTexts = headings.map((h) => {
    const firstChild = h.content?.[0] as { text?: string } | undefined;
    return (firstChild?.text || '').toLowerCase();
  });
  if (!headingTexts.includes('decision')) {
    errors.push('Decision section is required');
  }

  // depth check: H2 = depth 1, H3 = depth 2, no H4+ allowed (already enforced by heading config levels: [2, 3])

  return { valid: errors.length === 0, errors };
}

interface StructureValidatorProps {
  editor: Editor | null;
}

export default function StructureValidator({ editor }: StructureValidatorProps) {
  const { valid, errors } = validateStructure(editor);

  if (valid) {
    return (
      <div className="px-4 py-1 text-xs text-green-400 bg-green-900/20 border-t border-border">
        Structure valid
      </div>
    );
  }

  return (
    <div className="px-4 py-1 text-xs text-yellow-400 bg-yellow-900/20 border-t border-border">
      {errors.map((err, i) => (
        <span key={i} className="mr-3">
          {err}
        </span>
      ))}
    </div>
  );
}
