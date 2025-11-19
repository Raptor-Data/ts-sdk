<div align="center">
  <img src="assets/logo.png" alt="Raptor" width="200" />

  # Raptor Data TypeScript SDK

  **v1.0.0**

  ### Turn any document into version-controlled, AI-ready chunks in one API call—saving you **90% on embedding costs**.

  [![npm version](https://img.shields.io/npm/v/@raptor-data/ts-sdk?color=blue)](https://www.npmjs.com/package/@raptor-data/ts-sdk)
  [![Bundle Size](https://img.shields.io/badge/bundle%20size-73.8%20kB-brightgreen)](https://bundlephobia.com/package/@raptor-data/ts-sdk)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/npm/l/@raptor-data/ts-sdk)](https://github.com/raptor-data/ts-sdk/blob/main/LICENSE)
  [![Downloads](https://img.shields.io/npm/dm/@raptor-data/ts-sdk)](https://www.npmjs.com/package/@raptor-data/ts-sdk)

  **The Stripe of RAG - Simple, powerful document processing with built-in version control and cost optimization.**

  [Get Started](#quick-start) • [Documentation](https://docs.raptordata.dev) • [Discord](https://discord.gg/Q33RsJFn) • [API Reference](#api-reference)
</div>

---

## Why Raptor?

Most RAG systems **waste 60-90% of processing costs** re-embedding unchanged content. When you update a contract from v1 to v2, why re-process the 95% that stayed the same?

**Raptor solves this:**

1. **Auto-Linking** - Detects new versions automatically (no manual tracking required)
2. **Smart Deduplication** - Reuses unchanged chunks across versions (60-90% cost savings)
3. **Version Control** - Track document evolution with Git-like lineage
4. **One API Call** - Upload → Chunks, with full version control built-in

**Real-world example:**
```
Contract v1 → 1000 chunks → $10 to embed
Contract v2 → 950 chunks reused, 50 new → $0.50 to embed
Savings: 95% cost reduction
```

## Get API Key

Sign up at [raptordata.dev](https://raptordata.dev) to get your free API key.

**Free tier includes:**
- 1,000 pages/month
- All document types (PDF, DOCX)
- Semantic and recursive chunking
- Version control and duplicate detection
- Auto-linking
- Smart deduplication

## Benchmarks

Real-world performance with auto-linking and deduplication:

| Scenario | Traditional RAG | Raptor | Savings |
|----------|----------------|--------|---------|
| Contract v1 → v2 (95% unchanged) | $10.00 | $0.50 | **95%** |
| Policy update (80% unchanged) | $15.00 | $3.00 | **80%** |
| Duplicate upload | $10.00 | $0.00 | **100%** |
| Re-process with different config | $10.00 | $0.00 | **100%** |

*Based on typical embedding costs ($1/1M tokens) and document sizes (10k tokens/doc)*

## Installation

```bash
npm install @raptor-data/ts-sdk
# or
yarn add @raptor-data/ts-sdk
# or
pnpm add @raptor-data/ts-sdk
```

## Quick Start

```typescript
import Raptor from '@raptor-data/ts-sdk';

const raptor = new Raptor({ apiKey: 'rd_live_xxx' });

// Process document (one line!)
const result = await raptor.process('document.pdf');

console.log(`Got ${result.chunks.length} chunks`);
console.log(`First chunk: ${result.chunks[0]}`);
```

## Features

### Core Capabilities
- **TypeScript-first** - Full type safety, zero `any` types
- **Cross-platform** - Node.js, browsers, Edge Runtime, Cloudflare Workers
- **One API call** - Upload → processed chunks (no multi-step workflows)

### Cost Optimization
- **Auto-linking** - Detects document versions automatically (85%+ accuracy)
- **Smart deduplication** - Reuse unchanged chunks (60-90% savings)
  - Exact hash matching for identical chunks
  - Fuzzy matching for edited content (trigram similarity)
  - Sentence-level reuse tracking
  - Embedding reuse recommendations
- **Duplicate detection** - Zero-cost duplicate uploads

### Version Control
- **Git-like lineage** - Track document evolution
- **Chunk-level diffs** - See exactly what changed
- **Sentence level version control** - Track changes at the sentence level
- **Version labels** - Tag versions ("v2.0", "final", "draft")
- **Revert capability** - Roll back to previous versions

### Developer Experience
- **Streaming progress** - Real-time updates for long documents
- **React hooks** - `useProcessingStatus`, `useAutoLinkSettings`, etc.
- **Error handling** - Comprehensive network and validation errors
- **Timeout protection** - Configurable polling and request timeouts

## Examples

### Auto-Linking: The Killer Feature

Raptor automatically detects when you're uploading a new version of an existing document:

```typescript
// Upload initial contract
const v1 = await raptor.process('contract_2024.pdf');
// documentId: "doc-abc"

// Upload updated contract (different filename!)
const v2 = await raptor.process('contract_2024_revised.pdf');

// Auto-linking detected the relationship
if (v2.autoLinked) {
  console.log('Automatically linked to parent');
  console.log(`Parent: ${v2.parentDocumentId}`); // "doc-abc"
  console.log(`Confidence: ${(v2.autoLinkConfidence * 100).toFixed(0)}%`); // "92%"
  console.log(`Method: ${v2.autoLinkMethod}`); // "metadata_and_content"

  // Auto-linking explanations
  v2.autoLinkExplanation?.forEach(reason => console.log(`  - ${reason}`));
  // Output:
  //   - High filename similarity: "contract_2024.pdf" vs "contract_2024_revised.pdf"
  //   - Upload time proximity: 2 hours apart
  //   - Same file size range: within 10%
  //   - Content similarity: 94% chunk overlap
}
```

**How it works:**
1. **Metadata matching** - filename similarity, file size, upload time proximity
2. **Content matching** - extracts first 2KB, compares with existing documents
3. **Confidence scoring** - combines signals into 0-100% confidence score
4. **Auto-link if threshold met** - default 85%, configurable per-account or per-request

**Configure auto-linking:**
```typescript
// Set account defaults
await raptor.updateAutoLinkSettings({
  autoLinkEnabled: true,
  autoLinkThreshold: 0.90  // Require 90% confidence
});

// Override for specific upload
const result = await raptor.process('document.pdf', {
  autoLink: true,
  autoLinkThreshold: 0.95  // Require 95% for this one
});

// Disable auto-link for specific upload
const standalone = await raptor.process('new_doc.pdf', {
  autoLink: false  // Don't auto-link this upload
});
```

### Cost Savings in Action

```typescript
// Upload contract v1
const v1 = await raptor.process('contract_v1.pdf', {
  versionLabel: 'Initial Draft'
});
console.log(`Processed ${v1.chunks.length} chunks`);

// Update one paragraph, upload v2
const v2 = await raptor.process('contract_v2.pdf', {
  versionLabel: 'Client Revisions'
});

// Check deduplication savings
if (v2.deduplicationAvailable) {
  const variant = await raptor.getVariant(v2.variantId);

  if (variant.dedupStats) {
    console.log(`Chunks reused: ${variant.dedupStats.chunksReused}`);
    console.log(`Chunks created: ${variant.dedupStats.chunksCreated}`);
    console.log(`Savings: ${variant.dedupStats.savingsPercent}%`);

    // Enhanced stats
    console.log(`Sentence reuse ratio: ${(variant.dedupStats.sentenceReuseRatio * 100).toFixed(1)}%`);
  }
}

// Get chunk-level dedup info
const { chunks } = await raptor.getChunks(v2.variantId, {
  includeFullMetadata: true
});

chunks.forEach(chunk => {
  if (chunk.isReused) {
    console.log(`Chunk ${chunk.chunkIndex}: REUSED (${chunk.dedupStrategy})`);
  } else {
    console.log(`Chunk ${chunk.chunkIndex}: NEW`);
  }
});
```

### Version Control & Document Lineage

Track document evolution like Git tracks code:

```typescript
// Get complete version history
const lineage = await raptor.getDocumentLineage('document-id');
console.log(`Found ${lineage.totalVersions} versions`);

lineage.documents.forEach(doc => {
  console.log(`${doc.versionLabel || doc.filename}`);
  console.log(`  Similarity to parent: ${(doc.similarityScore * 100).toFixed(1)}%`);
  console.log(`  Created: ${doc.createdAt}`);
});

// Compare two versions
const diff = await raptor.compareDocuments('doc1-id', 'doc2-id');
console.log(diff.summary);
console.log(`Similarity: ${(diff.similarityScore * 100).toFixed(1)}%`);
console.log(`Added: ${diff.diff.addedCount} chunks`);
console.log(`Removed: ${diff.diff.removedCount} chunks`);

// Show what changed
diff.diff.addedChunks.forEach(chunk => {
  console.log(`+ [Chunk ${chunk.chunk_index}] ${chunk.text.substring(0, 100)}...`);
});

diff.diff.removedChunks.forEach(chunk => {
  console.log(`- [Chunk ${chunk.chunk_index}] ${chunk.text.substring(0, 100)}...`);
});
```

### Duplicate Detection (Zero Cost!)

Raptor detects when you upload the same file twice:

```typescript
// Upload original
const original = await raptor.process('contract.pdf');

// Upload same file again (even with different name)
const duplicate = await raptor.process('contract_copy.pdf');

if (duplicate.isDuplicate) {
  console.log('Duplicate detected');
  console.log(`Canonical: ${duplicate.canonicalDocumentId}`);
  console.log(`Processing skipped: ${duplicate.processingSkipped}`);
  console.log(`Credits saved: ${duplicate.costSaved}`);
}

// Find all duplicates
const result = await raptor.getDuplicates('document-id');
console.log(`Found ${result.count} duplicates`);

result.duplicates.forEach(doc => {
  console.log(`${doc.filename} (${doc.isCanonical ? 'original' : 'duplicate'})`);
});

// Cleanup duplicates
const allDuplicates = await raptor.listAllDuplicates();
console.log(`${allDuplicates.totalGroups} groups, ${allDuplicates.totalDuplicates} duplicates`);

for (const group of allDuplicates.duplicateGroups) {
  console.log(`Canonical: ${group.canonicalFilename}`);

  // Delete duplicates, keep canonical
  for (const dup of group.duplicates) {
    await raptor.deleteDocument(dup.id);
  }
}
```

### Next.js API Route

```typescript
import Raptor from '@raptor-data/ts-sdk';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  const raptor = new Raptor({ apiKey: process.env.RAPTOR_API_KEY! });

  try {
    const result = await raptor.process(file, {
      wait: true  // Wait for processing to complete
    });

    return Response.json({
      success: true,
      documentId: result.documentId,
      chunks: result.chunks.length,
      autoLinked: result.autoLinked,
      deduplicationAvailable: result.deduplicationAvailable
    });
  } catch (error) {
    if (error instanceof RaptorAPIError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    throw error;
  }
}
```

### Streaming Progress Updates

```typescript
for await (const progress of raptor.processStream('large-document.pdf')) {
  console.log(`${progress.stage}: ${progress.percent}%`);
  // Update your UI with progress
}

// Output:
// upload: 0%
// upload: 100%
// processing: 50%
// complete: 100%
```

### React Hooks

```typescript
import { useProcessingStatus, useAutoLinkSettings } from '@raptor-data/ts-sdk/hooks';

function DocumentUploader() {
  const { settings, updateSettings } = useAutoLinkSettings(client);
  const { variant, loading, error } = useProcessingStatus(client, variantId);

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={settings?.autoLinkEnabled}
          onChange={(e) => updateSettings({ autoLinkEnabled: e.target.checked })}
        />
        Enable Auto-Linking
      </label>

      {loading && <p>Processing...</p>}
      {variant?.status === 'completed' && (
        <p>Done! {variant.chunksCount} chunks</p>
      )}
    </div>
  );
}
```

## API Reference

### `new Raptor(config)`

Create a new Raptor client.

**Config:**

```typescript
interface RaptorConfig {
  apiKey: string;              // Your Raptor API key (required)
  baseUrl?: string;            // API base URL (default: https://api.raptordata.dev)
  timeout?: number;            // Request timeout in ms (default: 300000 / 5min)
  maxPollAttempts?: number;    // Max polling attempts (default: 300)
  pollTimeout?: number;        // Total polling timeout in ms (default: 300000 / 5min)
}
```

**Example:**

```typescript
const raptor = new Raptor({
  apiKey: 'rd_live_xxx',
  timeout: 60000,        // 1 minute timeout
  maxPollAttempts: 60,   // Poll for max 60 attempts
});
```

### `raptor.process(source, options?)`

Process a document and get chunks.

**Parameters:**

```typescript
source: string | File | Blob    // File path (Node.js) or File/Blob (browser)

options?: {
  wait?: boolean;                 // Wait for processing (default: true)
  pollInterval?: number;          // Polling interval in ms (default: 1000)
  maxPollAttempts?: number;       // Override global max attempts
  pollTimeout?: number;           // Override global timeout
  chunkSize?: number;             // Chunk size for splitting (default: 512)
  chunkOverlap?: number;          // Overlap between chunks (default: 50)
  strategy?: 'semantic' | 'recursive';  // Chunking strategy (default: 'semantic')
  processImages?: boolean;        // Enable image processing (default: false)
  extractSectionNumbers?: boolean;  // Extract section numbers (default: true)
  calculateQualityScores?: boolean;  // Calculate chunk quality scores (default: true)
  minChunkQuality?: number;       // Minimum quality threshold 0.0-1.0 (default: none)
  enableSmartContext?: boolean;   // Generate AI context for chunks (default: true)
  tableExtraction?: boolean;      // Enable table extraction (default: true)
  tableContextGeneration?: boolean;  // Generate table context (default: false)
  storeContent?: boolean;         // Store original document content (default: false)

  // Version control options
  parentDocumentId?: string;      // Parent document ID to link
  versionLabel?: string;          // Version label (e.g., "v2.0", "draft")

  // Auto-linking options
  autoLink?: boolean;             // Enable/disable auto-link (null = use account setting)
  autoLinkThreshold?: number;     // Confidence threshold 0.0-1.0 (null = use account default)
}
```

**Returns:**

```typescript
interface ProcessResult {
  documentId: string;
  chunks: string[];
  metadata: ChunkMetadata[];

  // Version control
  versionId: string;
  versionNumber: number;
  isNewDocument: boolean;
  isNewVersion: boolean;
  isNewVariant: boolean;

  // Auto-linking
  autoLinked?: boolean;
  autoLinkConfidence?: number;
  autoLinkExplanation?: string[];
  autoLinkMethod?: 'metadata' | 'metadata_and_content' | 'none';
  parentDocumentId?: string;

  // Deduplication
  deduplicationAvailable: boolean;
  isDuplicate?: boolean;
  canonicalDocumentId?: string;
  processingSkipped?: boolean;
  costSaved?: number;
}

interface ChunkMetadata {
  id: string;
  pageNumber: number | null;
  pageRange: number[];
  sectionHierarchy: string[];
  tokens: number;
  chunkIndex: number;
  metadata: Record<string, any>;
  chunkType: string | null;
  containsTable: boolean;
  tableMetadata: Record<string, any> | null;
  chunkingStrategy: string | null;
  sectionNumber: string | null;
  qualityScore: number | null;
  syntheticContext: string | null;
  parentChunkId: string | null;
  boundingBox: Record<string, any> | null;

  // Deduplication metadata
  dedupStrategy?: string | null;
  dedupConfidence?: number | null;
  isReused?: boolean;
  totalSentences?: number | null;
  reusedSentencesCount?: number | null;
  newSentencesCount?: number | null;
  contentReuseRatio?: number | null;
  embeddingRecommendation?: string | null;
  recommendationConfidence?: string | null;
  dedupMetadata?: Record<string, any> | null;
}
```

### Other Key Methods

#### Auto-Linking

```typescript
// Get current settings
const settings = await raptor.getAutoLinkSettings();
// { autoLinkEnabled: true, autoLinkThreshold: 0.85 }

// Update settings
await raptor.updateAutoLinkSettings({
  autoLinkEnabled: true,
  autoLinkThreshold: 0.90
});
```

#### Version Control

```typescript
// List all versions
const versions = await raptor.listVersions('document-id');

// Get specific version
const version = await raptor.getVersion('document-id', 2);

// Delete version
await raptor.deleteVersion('document-id', 2);

// Revert to previous version
await raptor.revertToVersion('document-id', 1);

// Set default version
await raptor.setDefaultVersion('document-id', 3);

// Update version label
await raptor.updateVersionLabel('document-id', 'Final v1.0');
```

#### Lineage & Comparison

```typescript
// Get lineage
const lineage = await raptor.getDocumentLineage('document-id');

// Get lineage tree
const tree = await raptor.getDocumentLineageTree('document-id');

// Get lineage stats
const stats = await raptor.getLineageStats('document-id');

// Find similar documents
const similar = await raptor.findSimilarDocuments('document-id', 0.7);

// Link to parent manually
await raptor.linkToParent('child-id', 'parent-id', 'v2.0');

// Unlink from lineage
await raptor.unlinkFromLineage('document-id');

// Compare documents
const diff = await raptor.compareDocuments('doc1-id', 'doc2-id');

// Get lineage changelog
const changelog = await raptor.getLineageChangelog('document-id');
```

#### Deduplication

```typescript
// Get dedup summary
const summary = await raptor.getDedupSummary('variant-id');

// Get chunks with dedup metadata
const { chunks } = await raptor.getChunks('variant-id', {
  includeFullMetadata: true
});

// Get chunks by document ID (uses primary variant)
const { chunks, total } = await raptor.getDocumentChunks('document-id', {
  includeFullMetadata: true
});
```

#### Duplicates

```typescript
// Find duplicates of specific document
const result = await raptor.getDuplicates('document-id');

// List all duplicate groups
const allDuplicates = await raptor.listAllDuplicates();
```

#### Document Management

```typescript
// List documents
const docs = await raptor.listDocuments({ limit: 20, offset: 0 });

// Delete document
await raptor.deleteDocument('document-id');

// Delete variant
await raptor.deleteVariant('variant-id');
```

For complete API documentation, see [docs.raptordata.dev](https://docs.raptordata.dev).

## Error Handling

```typescript
import Raptor, { RaptorError, RaptorAPIError } from '@raptor-data/ts-sdk';

const raptor = new Raptor({ apiKey: 'rd_live_xxx' });

try {
  const result = await raptor.process('document.pdf');
} catch (error) {
  if (error instanceof RaptorAPIError) {
    // API error (4xx, 5xx)
    console.error(`API Error ${error.statusCode}: ${error.message}`);
    console.error('Response:', error.response);
  } else if (error instanceof RaptorError) {
    // Client error (validation, network, etc.)
    console.error(`Client Error: ${error.message}`);
  } else {
    // Unknown error
    console.error('Unexpected error:', error);
  }
}
```

**Common status codes:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid API key)
- `413` - Request Entity Too Large (file too big)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error
- `503` - Service Unavailable

## Security Best Practices

### API Key Protection

**Never expose API keys in browser code:**

```typescript
// BAD - API key visible in browser DevTools
const raptor = new Raptor({ apiKey: 'rd_live_xxx' });
```

**Use backend proxy for browser apps:**

```typescript
// GOOD - Create a backend API route
// pages/api/raptor.ts
export async function POST(req: Request) {
  const raptor = new Raptor({ apiKey: process.env.RAPTOR_API_KEY! });
  return raptor.process(req.body.file);
}

// Frontend
fetch('/api/raptor', { method: 'POST', body: formData });
```

### Environment Variables

Always use environment variables for API keys:

```bash
# .env.local
RAPTOR_API_KEY=rd_live_xxx
```

```typescript
const raptor = new Raptor({
  apiKey: process.env.RAPTOR_API_KEY!
});
```

### Browser Warning

When using the SDK in a browser environment, you'll see a security warning:

```
[RAPTOR SDK SECURITY WARNING] You are using the Raptor SDK in a browser environment.
Your API key will be visible in the browser DevTools and network requests.
For production applications, consider using a backend proxy to protect your API key.
See: https://docs.raptordata.dev/authentication#security-best-practices
```

This is intentional to remind you to protect your API keys in production.

## TypeScript Support

Full TypeScript support with zero `any` types:

```typescript
import Raptor, {
  RaptorConfig,
  ProcessOptions,
  ProcessResult,
  ChunkMetadata,
  DocumentInfo,
  ListDocumentsOptions,
  DeletionResponse,
  AutoLinkSettings,
  RaptorError,
  RaptorAPIError
} from '@raptor-data/ts-sdk';

// All types are exported and fully typed
const raptor = new Raptor({ apiKey: 'xxx' });
const result: ProcessResult = await raptor.process('doc.pdf');
const deleteResult: DeletionResponse = await raptor.deleteDocument('doc-id');
```

## Supported Platforms

- **Node.js** 18+
- **Browsers** (Chrome, Firefox, Safari, Edge)
- **Next.js** (App Router, Pages Router, API Routes)
- **Vercel Edge Runtime**
- **Cloudflare Workers**
- **Deno** (with npm specifiers)
- **Bun**

## Rate Limits & Pricing

**Free tier:** 10,000 pages/month

Rate limit headers are included in API responses:
- `X-RateLimit-Limit` - Max requests per period
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp

When rate limited (HTTP 429), the SDK throws `RaptorAPIError`:

```typescript
try {
  await raptor.process('doc.pdf');
} catch (error) {
  if (error instanceof RaptorAPIError && error.statusCode === 429) {
    console.error('Rate limit exceeded. Please upgrade your plan.');
  }
}
```

## Documentation

Full documentation: [docs.raptordata.dev](https://docs.raptordata.dev)

## Support

- **GitHub**: [github.com/raptor-data/ts-sdk](https://github.com/raptor-data/ts-sdk)
- **Discord**: [discord.gg/Q33RsJFn](https://discord.gg/Q33RsJFn)
- **Email**: support@raptordata.dev
- **Docs**: [docs.raptordata.dev](https://docs.raptordata.dev)

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built by the Raptor Data team

  **Stop wasting money re-embedding the same content. Start using Raptor Data.**
</div>
