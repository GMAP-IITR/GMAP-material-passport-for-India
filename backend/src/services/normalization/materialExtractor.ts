import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';
import type { ExtractedMaterial, LlmExtractionResult } from '../../types/normalization';

const MODEL = 'claude-opus-4-8';

// Lazy-initialised so the client is only created when first needed.
// Validates ANTHROPIC_API_KEY here (not at startup) so the server can boot
// without the key and only fail if LLM normalization is actually invoked.
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Add it to backend/.env to enable LLM normalization.',
      );
    }
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// ─── Tool definition ──────────────────────────────────────────────────────────

const EXTRACT_MATERIALS_TOOL: Anthropic.Tool = {
  name: 'extract_materials',
  description:
    'Extract individual materials from a Bill of Quantities (BOQ) or construction ' +
    'schedule description. A single description may reference multiple distinct materials ' +
    '(e.g. concrete grade, cement type, steel grade). Return one entry per material.',
  input_schema: {
    type: 'object' as const,
    properties: {
      materials: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            materialName: {
              type: 'string',
              description: 'The material name as it appears in the description',
            },
            standardizedMaterialName: {
              type: 'string',
              description:
                'A standardised, title-cased name for the material, ' +
                'e.g. "Reinforced Concrete M30", "Ordinary Portland Cement", "Fe500 Reinforcement Steel"',
            },
            category: {
              type: 'string',
              description:
                'Top-level material category: Concrete, Steel, Masonry, Timber, Glass, ' +
                'Insulation, Finishing, Waterproofing, Electrical, Plumbing, or Other',
            },
            subcategory: {
              type: 'string',
              description: 'Optional finer grouping, e.g. "Ready Mix", "Structural", "Rebar"',
            },
            quantity: {
              type: 'number',
              description: 'Numeric quantity if mentioned in the description',
            },
            unit: {
              type: 'string',
              description: 'Unit of quantity, e.g. m³, kg, m², nos',
            },
            confidence: {
              type: 'number',
              description:
                'Confidence that this is a real, distinct material: 0.0 (very uncertain) to 1.0 (certain)',
            },
            notes: {
              type: 'string',
              description: 'Any additional context or caveats about the extraction',
            },
          },
          required: ['materialName', 'standardizedMaterialName', 'category', 'confidence'],
        },
      },
    },
    required: ['materials'],
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Uses Claude (claude-opus-4-8) with tool_use to extract structured materials
 * from a single BOQ/schedule description string.
 *
 * Returns an empty materials array (with no error thrown) when the description
 * contains no recognisable material references.
 */
export async function extractMaterialsFromDescription(
  description: string,
): Promise<LlmExtractionResult> {
  const client = getClient();

  const prompt =
    'You are a construction materials expert. Extract all distinct materials referenced ' +
    'in the following Bill of Quantities description. Each concrete grade, cement type, ' +
    'steel grade, or other material component should be a separate entry.\n\n' +
    `Description: "${description}"`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    tools: [EXTRACT_MATERIALS_TOOL],
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: prompt }],
  });

  // Find the tool_use block
  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  );

  if (!toolUseBlock || toolUseBlock.name !== 'extract_materials') {
    return { materials: [], rawDescription: description };
  }

  const toolInput = toolUseBlock.input as { materials?: unknown[] };
  const rawMaterials = Array.isArray(toolInput.materials) ? toolInput.materials : [];

  const materials: ExtractedMaterial[] = rawMaterials
    .filter(
      (m): m is Record<string, unknown> =>
        m !== null && typeof m === 'object',
    )
    .map((m) => ({
      materialName: String(m['materialName'] ?? '').trim(),
      standardizedMaterialName: String(m['standardizedMaterialName'] ?? '').trim(),
      category: String(m['category'] ?? 'Other').trim(),
      subcategory: m['subcategory'] ? String(m['subcategory']).trim() : undefined,
      quantity: typeof m['quantity'] === 'number' ? m['quantity'] : undefined,
      unit: m['unit'] ? String(m['unit']).trim() : undefined,
      confidence: Math.min(1, Math.max(0, Number(m['confidence'] ?? 0.5))),
      notes: m['notes'] ? String(m['notes']).trim() : undefined,
    }))
    .filter((m) => m.materialName.length > 0);

  return { materials, rawDescription: description };
}
