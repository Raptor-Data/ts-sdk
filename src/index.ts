/**
 * Raptor TypeScript SDK - The Stripe of RAG
 *
 * @example
 * ```typescript
 * import Raptor from '@raptor/sdk';
 *
 * const raptor = new Raptor({ apiKey: 'rd_live_xxx' });
 * const result = await raptor.process('document.pdf');
 * ```
 */

/**
 * Configuration options for the Raptor client
 */
export interface RaptorConfig {
    /** Your Raptor API key (get one at https://raptordata.dev) */
    apiKey: string;
    /** API base URL (default: https://api.raptordata.dev) */
    baseUrl?: string;
    /** Request timeout in milliseconds (default: 300000 / 5 minutes) */
    timeout?: number;
    /** Maximum number of polling attempts when waiting for processing (default: 300) */
    maxPollAttempts?: number;
    /** Total timeout for polling operations in milliseconds (default: 300000 / 5 minutes) */
    pollTimeout?: number;
    /**
     * DANGER: Allow connections to localhost and private IPs (for local development/testing only)
     * WARNING: Only enable this for local testing. Never use in production.
     * @default false
     */
    dangerouslyAllowLocalhost?: boolean;
}

/**
 * Document processing configuration options
 */
export interface ProcessingConfig {
    /** Target size for each chunk in tokens (default: 512) */
    chunkSize?: number;
    /** Number of tokens to overlap between chunks (default: 50) */
    chunkOverlap?: number;
    /** Chunking strategy - 'semantic' uses context-aware boundaries, 'recursive' uses hierarchical splitting (default: 'semantic') */
    strategy?: 'semantic' | 'recursive';
    /** Extract and process images from documents (default: false) */
    processImages?: boolean;
    /** Extract section numbers from document structure (default: true) */
    extractSectionNumbers?: boolean;
    /** Calculate quality scores for chunks to assess semantic coherence (default: true) */
    calculateQualityScores?: boolean;
    /** Minimum quality score threshold (0.0-1.0) - chunks below this are discarded (default: none) */
    minChunkQuality?: number;
    /** Generate smart context for chunks using AI to improve retrieval quality (default: true) */
    enableSmartContext?: boolean;
    /** Extract tables from documents with special handling (default: true) */
    tableExtraction?: boolean;
    /** Generate natural language context/summaries for extracted tables (default: false) */
    tableContextGeneration?: boolean;
    /** Store original document content in database for later retrieval (default: false) */
    storeContent?: boolean;
}

/**
 * Options for the process() method, including processing config and wait behavior
 */
export interface ProcessOptions extends ProcessingConfig {
    /** Wait for processing to complete before returning (default: true) */
    wait?: boolean;
    /** Interval in milliseconds between status polling checks (default: 1000) */
    pollInterval?: number;
    /** Maximum number of polling attempts before timing out (default: 300) */
    maxPollAttempts?: number;
    /** Total timeout for polling in milliseconds (default: 300000 / 5 minutes) */
    pollTimeout?: number;

    // Version control options
    /** Parent document ID to link this upload as a new version (bypasses auto-link) */
    parentDocumentId?: string;
    /** Optional version label (e.g., "v2.0", "draft") */
    versionLabel?: string;

    // Auto-linking options
    /** Enable/disable auto-link for this upload (null = use account setting) */
    autoLink?: boolean;
    /** Confidence threshold for auto-link (0.0-1.0, null = use account default) */
    autoLinkThreshold?: number;
}

/**
 * Metadata for a single chunk of processed document content
 */
export interface ChunkMetadata {
    /** Unique identifier for the chunk */
    id: string;
    /** Page number where chunk appears (null for non-paginated content) */
    pageNumber: number | null;
    /** Range of pages spanned by this chunk */
    pageRange: number[];
    /** Hierarchical section path (e.g., ["Chapter 1", "Section 1.1"]) */
    section: string[];
    /** Number of tokens in this chunk */
    tokens: number;
    /** Zero-based index of this chunk in the document */
    chunkIndex: number;
    /** Additional custom metadata extracted from the document */
    metadata?: Record<string, any>;
    /** Type classification of the chunk (e.g., "text", "table", "list") */
    chunkType?: string | null;
    /** Whether this chunk contains table data */
    containsTable?: boolean;
    /** Structured metadata for tables (rows, columns, headers, etc.) */
    tableMetadata?: Record<string, any> | null;
    /** Strategy used to create this chunk */
    chunkingStrategy?: string | null;
    /** Extracted section number (e.g., "1.2.3") */
    sectionNumber?: string | null;
    /** Quality score (0.0-1.0) indicating semantic coherence */
    qualityScore?: number | null;
    /** AI-generated context to improve retrieval quality */
    syntheticContext?: string | null;
    /** ID of parent chunk if this is a sub-chunk */
    parentChunkId?: string | null;
    /** Spatial coordinates for chunk location in document */
    boundingBox?: Record<string, any> | null;

    // Deduplication metadata (NEW)
    /** Deduplication strategy used: "exact", "high_reuse", "partial_reuse", "mixed_content", "fuzzy", or "new" */
    dedupStrategy?: string | null;
    /** Similarity confidence score for fuzzy/content-overlap matches (0.0-1.0) */
    dedupConfidence?: number | null;
    /** Whether this chunk was exactly reused from a previous version */
    isReused?: boolean;
    /** Total number of sentences in this chunk */
    totalSentences?: number | null;
    /** Number of sentences reused from parent version */
    reusedSentencesCount?: number | null;
    /** Number of new sentences not in parent version */
    newSentencesCount?: number | null;
    /** Percentage of sentences reused (0.0-1.0) */
    contentReuseRatio?: number | null;
    /** Suggested embedding action: "reuse", "consider_reuse", or "regenerate" */
    embeddingRecommendation?: string | null;
    /** Confidence level for embedding recommendation: "high", "medium", or "low" */
    recommendationConfidence?: string | null;
    /** Full deduplication metadata (JSONB) - only included when include_full_metadata=true */
    dedupMetadata?: Record<string, any> | null;
}

export interface ProcessingVariant {
    id: string;
    versionId: string;
    configHash: string;
    config: ProcessingConfig;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
    chunksCount: number;
    totalTokens: number;
    pageCount?: number;
    creditsCharged?: number;
    isPrimary: boolean;
    dedupStats?: {
        // Original chunk-level stats
        chunksCreated: number;
        chunksReused: number;
        totalChunks: number;
        savingsPercent: number;

        // Enhanced chunk categorization (fuzzy matching)
        chunksHighReuse?: number;
        chunksPartialReuse?: number;
        chunksFuzzyMatched?: number;

        // Sentence-level statistics
        totalSentences?: number;
        reusedSentences?: number;
        newSentences?: number;
        sentenceReuseRatio?: number;

        // Embedding recommendations (note: embeddings currently disabled)
        embeddingRecommendations?: {
            reuse?: number;
            considerReuse?: number;
            regenerate?: number;
        };
    };
    // Retry and DLQ tracking
    retryCount?: number;
    maxRetries?: number;
    isRetrying?: boolean;
    inDlq?: boolean;
    createdAt: string;
    processedAt?: string;
}

export interface DocumentVersion {
    id: string;
    documentId: string;
    versionNumber: number;
    parentVersionId?: string;
    filename: string;
    mimeType: string;
    fileSizeBytes: number;
    contentHash: string;
    createdAt: string;
    variants: ProcessingVariant[];
}

export interface UploadResult {
    variantId: string;
    documentId: string;
    versionId: string;
    versionNumber: number;
    isNewDocument: boolean;
    isNewVersion: boolean;
    isNewVariant: boolean;
    existingMatch: boolean;
    isDuplicate?: boolean;
    canonicalDocumentId?: string;
    processingSkipped?: boolean;
    costSaved?: number;
    status: string;
    taskId?: string;
    chunksCount?: number;
    estimatedPages: number;
    deduplicationAvailable: boolean;

    // Auto-linking metadata
    autoLinked?: boolean;
    autoLinkConfidence?: number;
    autoLinkExplanation?: string[];
    autoLinkMethod?: 'metadata' | 'metadata_and_content' | 'none';
    parentDocumentId?: string;
}

export interface DocumentIdentifier {
    documentId: string;
    version?: number;
    variantId?: string;
}

/**
 * Result from processing a document
 */
export interface ProcessResult {
    /** Unique document identifier */
    documentId: string;
    /** Processing variant identifier */
    variantId: string;
    /** Extracted text chunks */
    chunks: string[];
    /** Metadata for each chunk */
    metadata: ChunkMetadata[];
    /** Version identifier */
    versionId: string;
    /** Version number (1-based) */
    versionNumber: number;
    /** Whether this is a newly created document */
    isNewDocument: boolean;
    /** Whether this created a new version of an existing document */
    isNewVersion: boolean;
    /** Whether this created a new processing variant */
    isNewVariant: boolean;
    /** Whether an exact match (same content + config) already exists */
    existingMatch: boolean;
    /** Whether this is a duplicate of existing content (zero cost!) */
    isDuplicate?: boolean;
    /** ID of the canonical (original) document if this is a duplicate */
    canonicalDocumentId?: string;
    /** Whether processing was skipped due to duplicate/existing match */
    processingSkipped?: boolean;
    /** Credits saved by reusing existing processing */
    costSaved?: number;
    /** Whether chunk deduplication is available from previous versions */
    deduplicationAvailable: boolean;

    // Auto-linking metadata
    /** Whether auto-linking was used and found a parent */
    autoLinked?: boolean;
    /** Confidence score for the auto-link match (0.0-1.0) */
    autoLinkConfidence?: number;
    /** Detailed explanation of the auto-link decision */
    autoLinkExplanation?: string[];
    /** Method used for auto-linking */
    autoLinkMethod?: 'metadata' | 'metadata_and_content' | 'none';
    /** Parent document ID (from auto-link or manual) */
    parentDocumentId?: string;
}

/**
 * Summary information about a processed document
 */
export interface DocumentInfo {
    /** Unique document identifier */
    id: string;
    /** Original filename of the uploaded document */
    filename: string;
    /** MIME type of the document (e.g., 'application/pdf') */
    mimeType: string;
    /** Size of the original file in bytes */
    fileSizeBytes: number;
    /** Processing status (e.g., 'completed', 'processing', 'failed') */
    status: string;
    /** Total number of chunks created from this document */
    chunksCount: number;
    /** Total token count across all chunks */
    totalTokens: number;
    /** ISO 8601 timestamp when document was created */
    createdAt: string;
    /** Whether original document content is stored in the database */
    storeContent: boolean;
    /** ISO 8601 timestamp when document was soft-deleted (null if not deleted) */
    deletedAt: string | null;
    /** Version of the extraction engine used to process this document */
    extractorVersion: string | null;
    /** Current retry attempt number (1-3) if task is retrying */
    retryCount?: number;
    /** Maximum number of retry attempts (always 3 for failed tasks) */
    maxRetries?: number;
    /** True if task is actively retrying after failure */
    isRetrying?: boolean;
    /** True if task is in dead letter queue awaiting manual intervention */
    inDlq?: boolean;
}

/**
 * Chunk with camelCase fields (transformed from API)
 */
export interface Chunk {
    id: string;
    text: string;
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
    dedupStrategy: string | null;
    dedupConfidence: number | null;
    isReused: boolean;
    dedupSourceChunkId: string | null;
    totalSentences: number | null;
    reusedSentencesCount: number | null;
    newSentencesCount: number | null;
    contentReuseRatio: number | null;
    embeddingRecommendation: string | null;
    recommendationConfidence: string | null;
    dedupMetadata: Record<string, any> | null;
}

/**
 * Pagination options for listing documents
 */
export interface ListDocumentsOptions {
    /** Maximum number of documents to return (1-100, default: 20) */
    limit?: number;
    /** Number of documents to skip for pagination (default: 0) */
    offset?: number;
}

/**
 * Information about a duplicate document
 */
export interface DuplicateDocumentInfo {
    id: string;
    filename: string;
    isCanonical: boolean;
    createdAt: string;
    latestVersionId?: string;
}

/**
 * Group of duplicate documents with the same content hash
 */
export interface DuplicateGroup {
    contentHash: string;
    canonicalDocumentId: string;
    canonicalFilename: string;
    duplicates: DuplicateDocumentInfo[];
    totalCount: number;
}

/**
 * List of all duplicate groups for a user
 */
export interface DuplicatesListResponse {
    duplicateGroups: DuplicateGroup[];
    totalGroups: number;
    totalDuplicates: number;
}

/**
 * Response for getDuplicates method
 */
export interface DocumentDuplicatesResponse {
    documentId: string;
    duplicates: DuplicateDocumentInfo[];
    count: number;
}

/**
 * Document in a lineage
 */
export interface LineageDocument {
    id: string;
    filename: string;
    contentHash: string;
    versionLabel?: string;
    parentDocumentId?: string;
    similarityScore?: number;
    createdAt: string;
    fileSizeBytes: number;
    isCurrent: boolean;
}

/**
 * Response for getDocumentLineage method
 */
export interface DocumentLineageResponse {
    lineageId: string;
    totalVersions: number;
    documents: LineageDocument[];
}

/**
 * Tree node in a lineage tree
 */
export interface LineageTreeNode {
    document: {
        id: string;
        filename: string;
        versionLabel?: string;
        similarityScore?: number;
        createdAt: string;
    };
    children: LineageTreeNode[];
}

/**
 * Response for getDocumentLineageTree method
 */
export interface DocumentLineageTreeResponse {
    totalVersions: number;
    roots: LineageTreeNode[];
}

/**
 * Response for getLineageStats method
 */
export interface LineageStatsResponse {
    totalVersions: number;
    oldestVersion: {
        id: string;
        filename: string;
        createdAt: string;
        versionLabel?: string;
    };
    newestVersion: {
        id: string;
        filename: string;
        createdAt: string;
        versionLabel?: string;
    };
    totalSizeBytes: number;
    avgSimilarity: number;
    versionLabels: string[];
}

/**
 * Similar document suggestion
 */
export interface SimilarDocument {
    documentId: string;
    filename: string;
    similarityScore: number;
    createdAt: string;
    versionLabel?: string;
}

/**
 * Response for findSimilarDocuments method
 */
export interface SimilarDocumentsResponse {
    suggestions: SimilarDocument[];
    count: number;
}

/**
 * Response for linkToParent method
 */
export interface LinkToParentResponse {
    documentId: string;
    parentDocumentId: string;
    lineageId: string;
    similarityScore: number;
    versionLabel?: string;
}

/**
 * Response for unlinkFromLineage method
 */
export interface UnlinkFromLineageResponse {
    documentId: string;
    newLineageId: string;
    parentDocumentId: null;
    versionLabel: null;
}

/**
 * Response for compareDocuments method
 */
export interface DocumentComparisonResponse {
    similarityScore: number;  // Top-level for easy access
    document_1: {
        id: string;
        filename: string;
        contentHash: string;
        createdAt: string;
        totalChunks: number;
    };
    document_2: {
        id: string;
        filename: string;
        contentHash: string;
        createdAt: string;
        totalChunks: number;
    };
    diff: {
        addedChunks: any[];
        removedChunks: any[];
        unchangedChunks: any[];
        addedCount: number;
        removedCount: number;
        unchangedCount: number;
        similarityScore: number;
    };
    summary: string;
}

/**
 * Response for getLineageChangelog method
 */
export interface LineageChangelogResponse {
    changelogs: any[];
    totalTransitions: number;
}

/**
 * Response for getDedupSummary method - aggregate deduplication statistics
 */
export interface DedupSummaryResponse {
    /** Processing variant identifier */
    variantId: string;
    /** Total number of chunks in this variant */
    totalChunks: number;
    /** Breakdown of chunks by deduplication strategy */
    chunkBreakdown: Record<string, number>;
    /** Total sentences across all chunks */
    totalSentences: number;
    /** Number of sentences reused from parent version */
    reusedSentences: number;
    /** Number of new sentences not in parent */
    newSentences: number;
    /** Ratio of sentence reuse (0.0-1.0) */
    sentenceReuseRatio: number;
    /** Breakdown of embedding recommendations by action */
    embeddingRecommendations: Record<string, number>;
    /** Parent version ID if this variant has a parent */
    parentVersionId?: string | null;
    /** Whether this variant has a parent version for deduplication */
    hasParent: boolean;
}

/**
 * Auto-link settings for a user account
 */
export interface AutoLinkSettings {
    /** Whether auto-linking is enabled for this account */
    autoLinkEnabled: boolean;
    /** Confidence threshold for auto-linking (0.0-1.0) */
    autoLinkThreshold: number;
}

/**
 * Partial update for auto-link settings
 */
export interface AutoLinkSettingsUpdate {
    /** Enable/disable auto-linking */
    autoLinkEnabled?: boolean;
    /** Update confidence threshold (0.0-1.0) */
    autoLinkThreshold?: number;
}

/**
 * Information about a promotion action during deletion
 */
export interface PromotionInfo {
    type: 'variant' | 'version';
    id: string;
    versionNumber?: number;
    isNowDefault: boolean;
}

/**
 * Information about a cascade action during deletion
 */
export interface CascadeInfo {
    type: 'version' | 'document';
    id: string;
    variantsDeleted?: number;
    versionsDeleted?: number;
    chunksDeleted?: number;
}

/**
 * Response for all deletion operations (documents, versions, variants)
 */
export interface DeletionResponse {
    id: string;
    type: 'document' | 'version' | 'variant';
    status: string;
    promoted?: PromotionInfo | null;
    cascaded?: CascadeInfo | null;
    deletedAt: string;
}

/**
 * Response for deleteVersion method
 * @deprecated Use DeletionResponse instead
 */
export interface DeleteVersionResponse {
    deleted: boolean;
    documentId: string;
    versionNumber: number;
    softDelete: boolean;
}

/**
 * Response for revertToVersion method
 */
export interface RevertToVersionResponse {
    reverted: boolean;
    documentId: string;
    revertedFromVersion: number;
    newVersionNumber: number;
    newVersionId: string;
}

/**
 * Response for setDefaultVersion method
 */
export interface SetDefaultVersionResponse {
    updated: boolean;
    documentId: string;
    defaultVersionNumber: number;
    latestVersionId: string;
}

/**
 * Response for updateVersionLabel method
 */
export interface UpdateVersionLabelResponse {
    updated: boolean;
    documentId: string;
    versionLabel: string | null;
}

// Internal backend response types (for API responses)
interface BackendDocumentLineageResponse {
    lineage_id: string;
    total_versions: number;
    documents: {
        id: string;
        filename: string;
        content_hash: string;
        version_label: string | null;
        parent_document_id: string | null;
        similarity_score: number | null;
        created_at: string;
        file_size_bytes: number;
        is_current: boolean;
    }[];
}

interface BackendSimilarDocumentsResponse {
    suggestions: {
        document_id: string;
        filename: string;
        similarity_score: number;
        created_at: string;
        version_label: string | null;
    }[];
    count: number;
}

interface BackendLinkToParentResponse {
    document_id: string;
    parent_document_id: string;
    lineage_id: string;
    similarity_score: number;
    version_label: string | null;
}

interface BackendPromotionInfo {
    type: 'variant' | 'version';
    id: string;
    version_number?: number;
    is_now_default: boolean;
}

interface BackendCascadeInfo {
    type: 'version' | 'document';
    id: string;
    variants_deleted?: number;
    versions_deleted?: number;
    chunks_deleted?: number;
}

interface BackendDeletionResponse {
    id: string;
    type: 'document' | 'version' | 'variant';
    status: string;
    promoted?: BackendPromotionInfo | null;
    cascaded?: BackendCascadeInfo | null;
    deleted_at: string;
}

// Internal backend response types
interface BackendChunk {
    id: string;
    text: string;
    page_number: number | null;
    page_range: number[];
    section_hierarchy: string[];
    tokens: number;
    chunk_index: number;
    metadata: Record<string, any>;
    chunk_type: string | null;
    contains_table: boolean;
    table_metadata: Record<string, any> | null;
    chunking_strategy: string | null;
    section_number: string | null;
    quality_score: number | null;
    synthetic_context: string | null;
    parent_chunk_id: string | null;
    bounding_box: Record<string, any> | null;
    dedup_strategy: string | null;
    dedup_confidence: number | null;
    is_reused: boolean;
    dedup_source_chunk_id: string | null;
    total_sentences: number | null;
    reused_sentences_count: number | null;
    new_sentences_count: number | null;
    content_reuse_ratio: number | null;
    embedding_recommendation: string | null;
    recommendation_confidence: string | null;
    dedup_metadata: Record<string, any> | null;
}

interface BackendDocumentInfo {
    id: string;
    filename: string;
    mime_type: string;
    file_size_bytes: number;
    status: string;
    chunks_count: number;
    total_tokens: number;
    created_at: string;
    store_content: boolean;
    deleted_at: string | null;
    extractor_version: string | null;
}

interface BackendProcessingConfig {
    chunk_size?: number;
    chunk_overlap?: number;
    strategy?: string;
    process_images?: boolean;
    extract_section_numbers?: boolean;
    calculate_quality_scores?: boolean;
    min_chunk_quality?: number;
    enable_smart_context?: boolean;
    table_extraction?: boolean;
    table_context_generation?: boolean;
    store_content?: boolean;
}

interface BackendProcessingVariant {
    id: string;
    version_id: string;
    config_hash: string;
    config: BackendProcessingConfig;
    status: string;
    error?: string;
    chunks_count: number;
    total_tokens: number;
    page_count?: number;
    credits_charged?: number;
    is_primary: boolean;
    dedup_stats?: {
        chunks_created: number;
        chunks_reused: number;
        total_chunks: number;
        savings_percent: number;
        chunks_high_reuse?: number;
        chunks_partial_reuse?: number;
        chunks_fuzzy_matched?: number;
        total_sentences?: number;
        reused_sentences?: number;
        new_sentences?: number;
        sentence_reuse_ratio?: number;
        embedding_recommendations?: {
            reuse?: number;
            consider_reuse?: number;
            regenerate?: number;
        };
    };
    retry_count?: number;
    max_retries?: number;
    is_retrying?: boolean;
    in_dlq?: boolean;
    created_at: string;
    processed_at?: string;
}

interface BackendDocumentVersion {
    id: string;
    document_id: string;
    version_number: number;
    parent_version_id?: string;
    filename: string;
    mime_type: string;
    file_size_bytes: number;
    content_hash: string;
    created_at: string;
    variants: BackendProcessingVariant[];
}

interface BackendUploadResult {
    variant_id: string;
    document_id: string;
    version_id: string;
    version_number: number;
    is_new_document: boolean;
    is_new_version: boolean;
    is_new_variant: boolean;
    existing_match: boolean;
    is_duplicate?: boolean;
    canonical_document_id?: string;
    processing_skipped?: boolean;
    cost_saved?: number;
    status: string;
    task_id?: string;
    chunks_count?: number;
    estimated_pages: number;
    deduplication_available: boolean;

    // Auto-linking metadata
    auto_linked?: boolean;
    auto_link_confidence?: number;
    auto_link_explanation?: string[];
    auto_link_method?: string;
    parent_document_id?: string;
}

interface BackendDuplicateDocumentInfo {
    id: string;
    filename: string;
    is_canonical: boolean;
    created_at: string;
    latest_version_id?: string;
}

interface BackendDuplicateGroup {
    content_hash: string;
    canonical_document_id: string;
    canonical_filename: string;
    duplicates: BackendDuplicateDocumentInfo[];
    total_count: number;
}

interface BackendDuplicatesListResponse {
    duplicate_groups: BackendDuplicateGroup[];
    total_groups: number;
    total_duplicates: number;
}

interface BackendDocumentDuplicatesResponse {
    document_id: string;
    duplicates: BackendDuplicateDocumentInfo[];
    count: number;
}

// Type guard for error responses with detail property
interface ErrorWithDetail {
    detail?: string;
}

function hasDetail(error: unknown): error is ErrorWithDetail {
    return typeof error === 'object' && error !== null && 'detail' in error;
}

export class RaptorError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RaptorError';
    }
}

export class RaptorAPIError extends RaptorError {
    public statusCode: number;
    public response: any;

    constructor(message: string, statusCode: number, response: any) {
        super(message);
        this.name = 'RaptorAPIError';
        this.statusCode = statusCode;
        this.response = response;
    }
}

export default class Raptor {
    private apiKey: string;
    private baseUrl: string;
    private timeout: number;
    private maxPollAttempts: number;
    private pollTimeout: number;

    // UUID validation pattern
    private static readonly UUID_PATTERN =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // MIME type mapping for common file extensions
    private static readonly MIME_TYPES: Record<string, string> = {
        pdf: 'application/pdf',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        doc: 'application/msword',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xls: 'application/vnd.ms-excel',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ppt: 'application/vnd.ms-powerpoint',
        txt: 'text/plain',
        md: 'text/markdown',
        csv: 'text/csv',
        json: 'application/json',
        xml: 'application/xml',
        html: 'text/html',
        htm: 'text/html',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        bmp: 'image/bmp',
        tiff: 'image/tiff',
        tif: 'image/tiff',
    };

    /**
     * Get MIME type from filename
     */
    private static getMimeType(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        return ext
            ? Raptor.MIME_TYPES[ext] || 'application/octet-stream'
            : 'application/octet-stream';
    }

    /**
     * Validate UUID format
     */
    private static isValidUUID(id: string): boolean {
        return Raptor.UUID_PATTERN.test(id);
    }

    constructor(config: RaptorConfig) {
        // Validate API key
        if (!config.apiKey || config.apiKey.trim().length === 0) {
            throw new RaptorError('API key is required');
        }

        this.apiKey = config.apiKey;

        // Validate and sanitize baseUrl (SSRF protection)
        const baseUrl =
            config.baseUrl?.replace(/\/$/, '') || 'https://api.raptordata.dev';

        try {
            const url = new URL(baseUrl);

            // Block localhost, private IPs, and non-HTTP(S) protocols (unless explicitly allowed)
            const isLocalhost =
                url.hostname === 'localhost' ||
                url.hostname === '127.0.0.1' ||
                url.hostname.startsWith('192.168.') ||
                url.hostname.startsWith('10.') ||
                url.hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./);

            if (isLocalhost && !config.dangerouslyAllowLocalhost) {
                throw new RaptorError(
                    'Base URL cannot point to localhost or private IP addresses. ' +
                        'For local development, set dangerouslyAllowLocalhost: true in config.'
                );
            }

            if (isLocalhost && config.dangerouslyAllowLocalhost) {
                console.warn(
                    '[RAPTOR SDK WARNING] You have enabled dangerouslyAllowLocalhost. ' +
                        'This should ONLY be used for local development/testing. ' +
                        'Never use this in production!'
                );
            }

            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                throw new RaptorError(
                    'Base URL must use HTTP or HTTPS protocol'
                );
            }

            this.baseUrl = baseUrl;
        } catch (error) {
            if (error instanceof RaptorError) {
                throw error;
            }
            throw new RaptorError(
                `Invalid base URL: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }

        // Validate and set timeout values
        this.timeout = config.timeout || 300000; // 5 minutes
        if (this.timeout < 1000 || this.timeout > 3600000) {
            throw new RaptorError(
                'Timeout must be between 1000ms (1s) and 3600000ms (1h)'
            );
        }

        this.maxPollAttempts = config.maxPollAttempts || 300; // 5 minutes at 1s interval
        if (this.maxPollAttempts < 1 || this.maxPollAttempts > 3600) {
            throw new RaptorError(
                'Max poll attempts must be between 1 and 3600'
            );
        }

        this.pollTimeout = config.pollTimeout || 300000; // 5 minutes
        if (this.pollTimeout < 1000 || this.pollTimeout > 3600000) {
            throw new RaptorError(
                'Poll timeout must be between 1000ms (1s) and 3600000ms (1h)'
            );
        }

        // Security warning for browser environments
        if (typeof window !== 'undefined') {
            console.warn(
                '[RAPTOR SDK SECURITY WARNING] You are using the Raptor SDK in a browser environment. ' +
                    'Your API key will be visible in the browser DevTools and network requests. ' +
                    'For production applications, consider using a backend proxy to protect your API key. ' +
                    'See: https://docs.raptordata.dev/security'
            );
        }
    }

    /**
     * Process a document and get AI-ready chunks with version control
     *
     * This is the magic method - one call, document → chunks
     * Now supports version control and processing variants
     *
     * @param source - File path (Node.js), File object, or Blob
     * @param options - Processing options including config
     * @param options.wait - Wait for processing to complete (default: true)
     * @param options.pollInterval - Polling interval in ms (default: 1000)
     * @param options.chunkSize - Chunk size for splitting (default: 512)
     * @param options.chunkOverlap - Overlap between chunks (default: 50)
     * @param options.strategy - Chunking strategy: 'semantic', 'recursive', or 'fixed' (default: 'semantic')
     * @param options.processImages - Enable image processing (default: false)
     * @param options.extractSectionNumbers - Extract section numbers (default: true)
     * @param options.calculateQuality - Calculate chunk quality (default: true)
     * @param options.tableExtraction - Enable table extraction (default: true)
     * @param options.tableContextGeneration - Generate table context (default: false)
     * @param options.storeContent - Store document content after processing (default: true)
     * @param options.maxPollAttempts - Max polling attempts (default: 300)
     * @param options.pollTimeout - Max polling time in ms (default: 300000)
     *
     * @example
     * ```typescript
     * // Standard processing with custom config
     * const result = await raptor.process('document.pdf', {
     *   chunkSize: 1024,
     *   strategy: 'recursive',
     *   tableExtraction: true
     * });
     * console.log(`Got ${result.chunks.length} chunks`);
     * ```
     */
    async process(
        source: string | File | Blob,
        options: ProcessOptions = {}
    ): Promise<ProcessResult> {
        const {
            wait = true,
            pollInterval = 1000,
            chunkSize,
            chunkOverlap,
            strategy,
            processImages,
            extractSectionNumbers,
            calculateQualityScores,
            minChunkQuality,
            enableSmartContext,
            tableExtraction,
            tableContextGeneration,
            storeContent,
            parentDocumentId,
            versionLabel,
            autoLink,
            autoLinkThreshold,
        } = options;

        // 1. Upload document
        const formData = new FormData();

        if (typeof source === 'string') {
            // Node.js: read file from path
            if (typeof window === 'undefined') {
                const fs = await import('fs');
                const path = await import('path');

                // Path traversal protection: validate path exists and is a file
                try {
                    const stats = fs.statSync(source);
                    if (!stats.isFile()) {
                        throw new RaptorError(`Path is not a file: ${source}`);
                    }
                } catch (error) {
                    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                        throw new RaptorError(`File not found: ${source}`);
                    }
                    throw new RaptorError(
                        `Failed to access file: ${error instanceof Error ? error.message : 'Unknown error'}`
                    );
                }

                // Read file safely
                let fileBuffer;
                try {
                    fileBuffer = fs.readFileSync(source);
                } catch (error) {
                    throw new RaptorError(
                        `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
                    );
                }

                const filename = path.basename(source);

                // Validate filename doesn't contain path traversal characters
                if (
                    filename.includes('..') ||
                    filename.includes('/') ||
                    filename.includes('\\')
                ) {
                    throw new RaptorError('Invalid filename detected in path');
                }

                // Create Blob with correct MIME type
                const mimeType = Raptor.getMimeType(filename);
                const blob = new Blob([fileBuffer], { type: mimeType });

                formData.append('file', blob, filename);
            } else {
                throw new RaptorError('String paths only supported in Node.js');
            }
        } else {
            formData.append('file', source);
        }

        // Add processing config parameters
        if (chunkSize !== undefined)
            formData.append('chunk_size', chunkSize.toString());
        if (chunkOverlap !== undefined)
            formData.append('chunk_overlap', chunkOverlap.toString());
        if (strategy) formData.append('strategy', strategy);
        if (processImages !== undefined)
            formData.append('process_images', processImages.toString());
        if (extractSectionNumbers !== undefined)
            formData.append(
                'extract_section_numbers',
                extractSectionNumbers.toString()
            );
        if (calculateQualityScores !== undefined)
            formData.append(
                'calculate_quality_scores',
                calculateQualityScores.toString()
            );
        if (minChunkQuality !== undefined)
            formData.append('min_chunk_quality', minChunkQuality.toString());
        if (enableSmartContext !== undefined)
            formData.append(
                'enable_smart_context',
                enableSmartContext.toString()
            );
        if (tableExtraction !== undefined)
            formData.append('table_extraction', tableExtraction.toString());
        if (tableContextGeneration !== undefined)
            formData.append(
                'table_context_generation',
                tableContextGeneration.toString()
            );
        if (storeContent !== undefined)
            formData.append('store_content', storeContent.toString());

        // Build query parameters for version control and auto-link
        const queryParams = new URLSearchParams();
        if (parentDocumentId !== undefined)
            queryParams.append('parent_document_id', parentDocumentId);
        if (versionLabel !== undefined)
            queryParams.append('version_label', versionLabel);
        if (autoLink !== undefined)
            queryParams.append('auto_link', autoLink.toString());
        if (autoLinkThreshold !== undefined)
            queryParams.append('auto_link_threshold', autoLinkThreshold.toString());

        const queryString = queryParams.toString();
        const uploadUrl = queryString
            ? `${this.baseUrl}/api/documents?${queryString}`
            : `${this.baseUrl}/api/documents`;

        let uploadResponse;
        try {
            uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: formData,
            });
        } catch (error) {
            throw new RaptorError(
                `Network error during upload: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }

        if (!uploadResponse.ok) {
            const error: unknown = await uploadResponse
                .json()
                .catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Upload failed: ${errorDetail || uploadResponse.statusText}`,
                uploadResponse.status,
                error
            );
        }

        let uploadData: BackendUploadResult;
        try {
            uploadData = (await uploadResponse.json()) as BackendUploadResult;
        } catch (error) {
            throw new RaptorError(
                `Failed to parse upload response: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }

        const variantId = uploadData.variant_id;
        if (!variantId) {
            throw new RaptorError('Upload response missing variant ID');
        }

        if (!wait) {
            return {
                documentId: uploadData.document_id,
                variantId: uploadData.variant_id,
                chunks: [],
                metadata: [],
                versionId: uploadData.version_id,
                versionNumber: uploadData.version_number,
                isNewDocument: uploadData.is_new_document,
                isNewVersion: uploadData.is_new_version,
                isNewVariant: uploadData.is_new_variant,
                existingMatch: uploadData.existing_match,
                isDuplicate: uploadData.is_duplicate,
                canonicalDocumentId: uploadData.canonical_document_id,
                processingSkipped: uploadData.processing_skipped,
                costSaved: uploadData.cost_saved,
                deduplicationAvailable: uploadData.deduplication_available,
                autoLinked: uploadData.auto_linked,
                autoLinkConfidence: uploadData.auto_link_confidence,
                autoLinkExplanation: uploadData.auto_link_explanation,
                autoLinkMethod: uploadData.auto_link_method as 'metadata' | 'metadata_and_content' | 'none' | undefined,
                parentDocumentId: uploadData.parent_document_id,
            };
        }

        // 2. Poll variant for completion with timeout protection
        const maxAttempts = options.maxPollAttempts || this.maxPollAttempts;
        const pollTimeoutMs = options.pollTimeout || this.pollTimeout;
        const startTime = Date.now();
        let attempts = 0;

        while (true) {
            attempts++;

            // Check max attempts
            if (attempts > maxAttempts) {
                throw new RaptorError(
                    `Processing timeout: exceeded ${maxAttempts} polling attempts`
                );
            }

            // Check timeout
            if (Date.now() - startTime > pollTimeoutMs) {
                throw new RaptorError(
                    `Processing timeout: exceeded ${pollTimeoutMs}ms`
                );
            }

            let statusResponse;
            try {
                statusResponse = await fetch(
                    `${this.baseUrl}/api/documents/variants/${variantId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${this.apiKey}`,
                        },
                    }
                );
            } catch (error) {
                throw new RaptorError(
                    `Network error during status check: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }

            if (!statusResponse.ok) {
                const error: unknown = await statusResponse
                    .json()
                    .catch(() => ({}));
                const errorDetail = hasDetail(error) ? error.detail : undefined;
                throw new RaptorAPIError(
                    `Status check failed: ${errorDetail || statusResponse.statusText}`,
                    statusResponse.status,
                    error
                );
            }

            let variant: BackendProcessingVariant;
            try {
                variant =
                    (await statusResponse.json()) as BackendProcessingVariant;
            } catch (error) {
                throw new RaptorError(
                    `Failed to parse status response: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }

            if (variant.status === 'completed') {
                break;
            } else if (variant.status === 'failed') {
                throw new RaptorError(
                    `Processing failed: ${variant.error || 'Unknown error'}`
                );
            }

            await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }

        // 3. Get chunks for this variant
        let chunksResponse;
        try {
            chunksResponse = await fetch(
                `${this.baseUrl}/api/documents/variants/${variantId}/chunks`,
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                }
            );
        } catch (error) {
            throw new RaptorError(
                `Network error while fetching chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }

        if (!chunksResponse.ok) {
            const error: unknown = await chunksResponse
                .json()
                .catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to get chunks: ${errorDetail || chunksResponse.statusText}`,
                chunksResponse.status,
                error
            );
        }

        let chunksData: { chunks: BackendChunk[]; total: number };
        try {
            chunksData = (await chunksResponse.json()) as {
                chunks: BackendChunk[];
                total: number;
            };
        } catch (error) {
            throw new RaptorError(
                `Failed to parse chunks response: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }

        const chunks = chunksData.chunks || [];

        // 4. Format output
        const documentId = uploadData.document_id;

        return {
            documentId,
            variantId: uploadData.variant_id,
            chunks: chunks.map((c) => c.text),
            metadata: chunks.map((c) => ({
                id: c.id,
                pageNumber: c.page_number,
                pageRange: c.page_range || [],
                section: c.section_hierarchy || [],
                tokens: c.tokens,
                chunkIndex: c.chunk_index,
                metadata: c.metadata,
                chunkType: c.chunk_type,
                containsTable: c.contains_table,
                tableMetadata: c.table_metadata,
                chunkingStrategy: c.chunking_strategy,
                sectionNumber: c.section_number,
                qualityScore: c.quality_score,
                syntheticContext: c.synthetic_context,
                parentChunkId: c.parent_chunk_id,
                boundingBox: c.bounding_box,
                dedupStrategy: c.dedup_strategy,
                dedupConfidence: c.dedup_confidence,
                isReused: c.is_reused,
                totalSentences: c.total_sentences,
                reusedSentencesCount: c.reused_sentences_count,
                newSentencesCount: c.new_sentences_count,
                contentReuseRatio: c.content_reuse_ratio,
                embeddingRecommendation: c.embedding_recommendation,
                recommendationConfidence: c.recommendation_confidence,
                dedupMetadata: c.dedup_metadata,
            })),
            versionId: uploadData.version_id,
            versionNumber: uploadData.version_number,
            isNewDocument: uploadData.is_new_document,
            isNewVersion: uploadData.is_new_version,
            isNewVariant: uploadData.is_new_variant,
            existingMatch: uploadData.existing_match,
            isDuplicate: uploadData.is_duplicate,
            canonicalDocumentId: uploadData.canonical_document_id,
            processingSkipped: uploadData.processing_skipped,
            costSaved: uploadData.cost_saved,
            deduplicationAvailable: uploadData.deduplication_available,
            autoLinked: uploadData.auto_linked,
            autoLinkConfidence: uploadData.auto_link_confidence,
            autoLinkExplanation: uploadData.auto_link_explanation,
            autoLinkMethod: uploadData.auto_link_method as 'metadata' | 'metadata_and_content' | 'none' | undefined,
            parentDocumentId: uploadData.parent_document_id,
        };
    }

    /**
     * Process document with streaming progress updates
     *
     * @example
     * ```typescript
     * for await (const progress of raptor.processStream('doc.pdf')) {
     *   console.log(`${progress.stage}: ${progress.percent}%`);
     * }
     * ```
     */
    async *processStream(
        source: string | File | Blob,
        options: ProcessOptions = {}
    ): AsyncGenerator<{
        stage: string;
        percent: number;
        message: string;
        variantId?: string;
    }> {
        yield { stage: 'upload', percent: 0, message: 'Uploading document...' };

        // Upload and get variant ID
        const formData = new FormData();
        if (typeof source === 'string') {
            if (typeof window === 'undefined') {
                const fs = await import('fs');
                const path = await import('path');
                const fileBuffer = fs.readFileSync(source);
                const filename = path.basename(source);
                const mimeType = Raptor.getMimeType(filename);
                const blob = new Blob([fileBuffer], { type: mimeType });
                formData.append('file', blob, filename);
            } else {
                throw new RaptorError('String paths only supported in Node.js');
            }
        } else {
            formData.append('file', source);
        }

        // Add config params
        const {
            chunkSize,
            chunkOverlap,
            strategy,
            processImages,
            extractSectionNumbers,
            calculateQualityScores,
            minChunkQuality,
            enableSmartContext,
            tableExtraction,
            tableContextGeneration,
            storeContent,
        } = options;
        if (chunkSize !== undefined)
            formData.append('chunk_size', chunkSize.toString());
        if (chunkOverlap !== undefined)
            formData.append('chunk_overlap', chunkOverlap.toString());
        if (strategy) formData.append('strategy', strategy);
        if (processImages !== undefined)
            formData.append('process_images', processImages.toString());
        if (extractSectionNumbers !== undefined)
            formData.append(
                'extract_section_numbers',
                extractSectionNumbers.toString()
            );
        if (calculateQualityScores !== undefined)
            formData.append(
                'calculate_quality_scores',
                calculateQualityScores.toString()
            );
        if (minChunkQuality !== undefined)
            formData.append('min_chunk_quality', minChunkQuality.toString());
        if (enableSmartContext !== undefined)
            formData.append(
                'enable_smart_context',
                enableSmartContext.toString()
            );
        if (tableExtraction !== undefined)
            formData.append('table_extraction', tableExtraction.toString());
        if (tableContextGeneration !== undefined)
            formData.append(
                'table_context_generation',
                tableContextGeneration.toString()
            );
        if (storeContent !== undefined)
            formData.append('store_content', storeContent.toString());

        const uploadResponse = await fetch(`${this.baseUrl}/api/documents`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.apiKey}` },
            body: formData,
        });

        if (!uploadResponse.ok) {
            throw new RaptorAPIError(
                'Upload failed',
                uploadResponse.status,
                await uploadResponse.json().catch(() => ({}))
            );
        }

        const uploadData = (await uploadResponse.json()) as BackendUploadResult;
        const variantId = uploadData.variant_id;

        yield {
            stage: 'upload',
            percent: 100,
            message: 'Upload complete',
            variantId,
        };

        // Poll variant with progress updates and timeout protection
        const maxAttempts = options.maxPollAttempts || this.maxPollAttempts;
        const pollTimeoutMs = options.pollTimeout || this.pollTimeout;
        const startTime = Date.now();
        let attempts = 0;

        while (true) {
            attempts++;

            if (attempts > maxAttempts) {
                throw new RaptorError(
                    `Processing timeout: exceeded ${maxAttempts} polling attempts`
                );
            }

            if (Date.now() - startTime > pollTimeoutMs) {
                throw new RaptorError(
                    `Processing timeout: exceeded ${pollTimeoutMs}ms`
                );
            }

            const statusResponse = await fetch(
                `${this.baseUrl}/api/documents/variants/${variantId}`,
                { headers: { Authorization: `Bearer ${this.apiKey}` } }
            );

            const variant =
                (await statusResponse.json()) as BackendProcessingVariant;

            if (variant.status === 'completed') {
                yield {
                    stage: 'complete',
                    percent: 100,
                    message: 'Processing complete',
                    variantId,
                };
                break;
            } else if (variant.status === 'failed') {
                throw new RaptorError(
                    `Processing failed: ${variant.error || 'Unknown error'}`
                );
            }

            const stage =
                variant.status === 'processing' ? 'processing' : 'queued';
            const percent = stage === 'processing' ? 50 : 25;

            yield {
                stage,
                percent,
                message: `Document ${stage}...`,
                variantId,
            };

            await new Promise((resolve) =>
                setTimeout(resolve, options.pollInterval || 1000)
            );
        }
    }

    /**
     * Get document with smart defaults for version and variant selection
     *
     * @example
     * ```typescript
     * // Get latest version, primary variant
     * const doc = await raptor.getDocument('doc-id');
     *
     * // Get specific version
     * const v1 = await raptor.getDocument('doc-id', { version: 1 });
     *
     * // Get specific variant
     * const variant = await raptor.getDocument('doc-id', { variantId: 'var-id' });
     * ```
     */
    async getDocument(
        documentId: string,
        options?: {
            version?: number;
            variantId?: string;
        }
    ): Promise<DocumentVersion> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        const params = new URLSearchParams();
        if (options?.version !== undefined)
            params.append('version', options.version.toString());
        if (options?.variantId) params.append('variant_id', options.variantId);

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}?${params}`,
            { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to get document: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        interface BackendDocumentResponse {
            id: string;
            document_id?: string;
            version_number?: number;
            parent_version_id?: string;
            filename: string;
            mime_type: string;
            file_size_bytes: number;
            content_hash?: string;
            created_at: string;
            variants?: BackendProcessingVariant[];
        }

        const data = (await response.json()) as BackendDocumentResponse;

        // Handle both DocumentResponse (flat) and DocumentVersionResponse (with variants)
        // DocumentResponse from /api/documents/{id} doesn't have variants, version_number, etc.
        // DocumentVersionResponse from /api/documents/{id}/versions/{num} has variants array
        const variants = data.variants || [];

        return {
            id: data.id,
            documentId: data.document_id || data.id, // DocumentResponse uses 'id', DocumentVersionResponse uses 'document_id'
            versionNumber: data.version_number || 1, // DocumentResponse doesn't have version_number
            parentVersionId: data.parent_version_id,
            filename: data.filename,
            mimeType: data.mime_type,
            fileSizeBytes: data.file_size_bytes,
            contentHash: data.content_hash || '', // DocumentResponse might not have content_hash
            createdAt: data.created_at,
            variants: variants.map((v) => this.transformVariant(v)),
        };
    }

    /**
     * List all versions for a document
     *
     * @example
     * ```typescript
     * const versions = await raptor.listVersions('doc-id');
     * versions.forEach(v => console.log(`Version ${v.versionNumber}: ${v.variants.length} variants`));
     * ```
     */
    async listVersions(documentId: string): Promise<DocumentVersion[]> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}/versions`,
            { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to list versions: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        const data = (await response.json()) as {
            versions: BackendDocumentVersion[];
        };

        return data.versions.map((v) => ({
            id: v.id,
            documentId: v.document_id,
            versionNumber: v.version_number,
            parentVersionId: v.parent_version_id,
            filename: v.filename,
            mimeType: v.mime_type,
            fileSizeBytes: v.file_size_bytes,
            contentHash: v.content_hash,
            createdAt: v.created_at,
            variants: v.variants.map((variant) =>
                this.transformVariant(variant)
            ),
        }));
    }

    /**
     * Get specific version of a document
     *
     * @example
     * ```typescript
     * const version2 = await raptor.getVersion('doc-id', 2);
     * console.log(`Version 2 has ${version2.variants.length} variants`);
     * ```
     */
    async getVersion(
        documentId: string,
        versionNumber: number
    ): Promise<DocumentVersion> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}/versions/${versionNumber}`,
            { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to get version: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        const data = (await response.json()) as BackendDocumentVersion;

        return {
            id: data.id,
            documentId: data.document_id,
            versionNumber: data.version_number,
            parentVersionId: data.parent_version_id,
            filename: data.filename,
            mimeType: data.mime_type,
            fileSizeBytes: data.file_size_bytes,
            contentHash: data.content_hash,
            createdAt: data.created_at,
            variants: data.variants.map((v) => this.transformVariant(v)),
        };
    }

    /**
     * Reprocess a document with different configuration to create a new variant
     *
     * @example
     * ```typescript
     * const result = await raptor.reprocess('doc-id', {
     *   chunkSize: 256,
     *   strategy: 'semantic'
     * });
     * console.log(`New variant created: ${result.variantId}`);
     * ```
     */
    async reprocess(
        documentId: string,
        config: ProcessingConfig
    ): Promise<UploadResult> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}/reprocess`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chunk_size: config.chunkSize || 512,
                    chunk_overlap: config.chunkOverlap || 50,
                    strategy: config.strategy || 'semantic',
                    process_images: config.processImages || false,
                    extract_section_numbers:
                        config.extractSectionNumbers ?? true,
                    calculate_quality_scores:
                        config.calculateQualityScores ?? true,
                    min_chunk_quality: config.minChunkQuality,
                    enable_smart_context: config.enableSmartContext ?? true,
                    table_extraction: config.tableExtraction ?? true,
                    table_context_generation:
                        config.tableContextGeneration || false,
                    store_content: config.storeContent,
                }),
            }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Reprocess failed: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        const data = (await response.json()) as BackendUploadResult;

        return {
            variantId: data.variant_id,
            documentId: data.document_id,
            versionId: data.version_id,
            versionNumber: data.version_number,
            isNewDocument: data.is_new_document,
            isNewVersion: data.is_new_version,
            isNewVariant: data.is_new_variant,
            existingMatch: data.existing_match,
            isDuplicate: data.is_duplicate,
            canonicalDocumentId: data.canonical_document_id,
            processingSkipped: data.processing_skipped,
            costSaved: data.cost_saved,
            status: data.status,
            taskId: data.task_id,
            chunksCount: data.chunks_count,
            estimatedPages: data.estimated_pages,
            deduplicationAvailable: data.deduplication_available,
        };
    }

    /**
     * Get processing variant details
     *
     * @example
     * ```typescript
     * const variant = await raptor.getVariant('variant-id');
     * console.log(`Status: ${variant.status}, Chunks: ${variant.chunksCount}`);
     * ```
     */
    async getVariant(variantId: string): Promise<ProcessingVariant> {
        if (!variantId || !Raptor.isValidUUID(variantId)) {
            throw new RaptorError(`Invalid variant ID: ${variantId}`);
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/variants/${variantId}`,
            { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to get variant: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        const data = (await response.json()) as BackendProcessingVariant;
        return this.transformVariant(data);
    }

    /**
     * Get chunks for a specific variant
     *
     * @example
     * ```typescript
     * const chunks = await raptor.getChunks('variant-id', { limit: 10 });
     * console.log(`Retrieved ${chunks.length} chunks`);
     * ```
     */
    async getChunks(
        variantId: string,
        options?: { limit?: number; offset?: number; includeFullMetadata?: boolean }
    ): Promise<{ chunks: Chunk[]; total: number }> {
        if (!variantId || !Raptor.isValidUUID(variantId)) {
            throw new RaptorError(`Invalid variant ID: ${variantId}`);
        }

        const params = new URLSearchParams();
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.offset) params.append('offset', options.offset.toString());
        if (options?.includeFullMetadata) params.append('include_full_metadata', 'true');

        const response = await fetch(
            `${this.baseUrl}/api/documents/variants/${variantId}/chunks?${params}`,
            { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to get chunks: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        const data = (await response.json()) as {
            chunks: any[];
            total: number;
        };

        return {
            chunks: Array.isArray(data.chunks)
                ? data.chunks.map((c: any) => ({
                      id: c.id,
                      text: c.text,
                      pageNumber: c.page_number,
                      pageRange: c.page_range || [],
                      sectionHierarchy: c.section_hierarchy || [],
                      tokens: c.tokens,
                      chunkIndex: c.chunk_index,
                      metadata: c.metadata,
                      chunkType: c.chunk_type,
                      containsTable: c.contains_table,
                      tableMetadata: c.table_metadata,
                      chunkingStrategy: c.chunking_strategy,
                      sectionNumber: c.section_number,
                      qualityScore: c.quality_score,
                      syntheticContext: c.synthetic_context,
                      parentChunkId: c.parent_chunk_id,
                      boundingBox: c.bounding_box,
                      dedupStrategy: c.dedup_strategy,
                      dedupConfidence: c.dedup_confidence,
                      isReused: c.is_reused,
                      dedupSourceChunkId: c.dedup_source_chunk_id,
                      totalSentences: c.total_sentences,
                      reusedSentencesCount: c.reused_sentences_count,
                      newSentencesCount: c.new_sentences_count,
                      contentReuseRatio: c.content_reuse_ratio,
                      embeddingRecommendation: c.embedding_recommendation,
                      recommendationConfidence: c.recommendation_confidence,
                      dedupMetadata: c.dedup_metadata,
                  }))
                : [],
            total: typeof data.total === 'number' ? data.total : 0,
        };
    }

    /**
     * Get chunks for a document (uses primary variant)
     *
     * Retrieves chunks for a document using its primary variant.
     * Use this when you have a document ID but not a specific variant ID.
     *
     * @param documentId - Document identifier
     * @param options - Optional parameters
     * @returns Array of chunks with total count
     *
     * @example
     * ```typescript
     * const { chunks, total } = await raptor.getDocumentChunks('doc-id', {
     *     includeFullMetadata: true
     * });
     * ```
     */
    async getDocumentChunks(
        documentId: string,
        options?: {
            includeFullMetadata?: boolean;
        }
    ): Promise<{ chunks: Chunk[]; total: number }> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        const url = new URL(`${this.baseUrl}/api/documents/${documentId}/chunks`);
        if (options?.includeFullMetadata) {
            url.searchParams.set('include_full_metadata', 'true');
        }

        const response = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${this.apiKey}` },
        });

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to get document chunks: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        const data = await response.json();

        // Ensure we always return a valid structure, even if response is malformed
        return {
            chunks: Array.isArray(data.chunks)
                ? data.chunks.map((c: any) => ({
                      id: c.id,
                      text: c.text,
                      pageNumber: c.page_number,
                      pageRange: c.page_range || [],
                      sectionHierarchy: c.section_hierarchy || [],
                      tokens: c.tokens,
                      chunkIndex: c.chunk_index,
                      metadata: c.metadata,
                      chunkType: c.chunk_type,
                      containsTable: c.contains_table,
                      tableMetadata: c.table_metadata,
                      chunkingStrategy: c.chunking_strategy,
                      sectionNumber: c.section_number,
                      qualityScore: c.quality_score,
                      syntheticContext: c.synthetic_context,
                      parentChunkId: c.parent_chunk_id,
                      boundingBox: c.bounding_box,
                      dedupStrategy: c.dedup_strategy,
                      dedupConfidence: c.dedup_confidence,
                      isReused: c.is_reused,
                      dedupSourceChunkId: c.dedup_source_chunk_id,
                      totalSentences: c.total_sentences,
                      reusedSentencesCount: c.reused_sentences_count,
                      newSentencesCount: c.new_sentences_count,
                      contentReuseRatio: c.content_reuse_ratio,
                      embeddingRecommendation: c.embedding_recommendation,
                      recommendationConfidence: c.recommendation_confidence,
                      dedupMetadata: c.dedup_metadata,
                  }))
                : [],
            total: typeof data.total === 'number' ? data.total : 0,
        };
    }

    /**
     * Get aggregate deduplication statistics for a variant
     *
     * Returns detailed breakdown of chunk deduplication strategies,
     * sentence-level reuse metrics, and embedding recommendations.
     *
     * @param variantId - Variant ID to get dedup summary for
     *
     * @example
     * ```typescript
     * const summary = await raptor.getDedupSummary('variant-id');
     * console.log(`Total chunks: ${summary.totalChunks}`);
     * console.log(`Sentence reuse ratio: ${summary.sentenceReuseRatio * 100}%`);
     * console.log('Chunk breakdown:', summary.chunkBreakdown);
     * console.log('Embedding recommendations:', summary.embeddingRecommendations);
     * ```
     */
    async getDedupSummary(variantId: string): Promise<DedupSummaryResponse> {
        if (!variantId || !Raptor.isValidUUID(variantId)) {
            throw new RaptorError(`Invalid variant ID: ${variantId}`);
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/variants/${variantId}/dedup-summary`,
            { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to get dedup summary: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        return (await response.json()) as DedupSummaryResponse;
    }

    /**
     * Cancel processing for a variant
     *
     * @example
     * ```typescript
     * await raptor.cancelProcessing('variant-id');
     * console.log('Processing cancelled');
     * ```
     */
    async cancelProcessing(variantId: string): Promise<void> {
        if (!variantId || !Raptor.isValidUUID(variantId)) {
            throw new RaptorError(`Invalid variant ID: ${variantId}`);
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/variants/${variantId}/cancel`,
            {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${this.apiKey}` },
            }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to cancel: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }
    }

    /**
     * Delete a specific processing variant
     *
     * Removes a processing variant and its associated chunks. If this is the last
     * variant in a version, the version will be deleted. If this is the last version,
     * the entire document will be deleted. Promotion and cascade information will
     * be included in the response when applicable.
     *
     * @param variantId - Variant ID to delete
     *
     * @example
     * ```typescript
     * const result = await raptor.deleteVariant('variant-id');
     * console.log(`Deleted variant (${result.status})`);
     * if (result.promoted) {
     *   console.log(`Promoted ${result.promoted.type}: ${result.promoted.id}`);
     * }
     * if (result.cascaded) {
     *   console.log(`Cascaded to delete ${result.cascaded.type}: ${result.cascaded.id}`);
     * }
     * ```
     */
    async deleteVariant(variantId: string): Promise<DeletionResponse> {
        if (!variantId || !Raptor.isValidUUID(variantId)) {
            throw new RaptorError(`Invalid variant ID: ${variantId}`);
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/variants/${variantId}`,
            {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${this.apiKey}` },
            }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to delete variant: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        const data = (await response.json()) as BackendDeletionResponse;
        return this.transformDeletionResponse(data);
    }

    /**
     * Wait for processing to complete with progress callbacks
     *
     * @example
     * ```typescript
     * const variant = await raptor.waitForProcessing('variant-id', {
     *   onProgress: (v) => console.log(`Status: ${v.status}`)
     * });
     * console.log(`Completed with ${variant.chunksCount} chunks`);
     * ```
     */
    async waitForProcessing(
        variantId: string,
        options?: {
            maxWaitMs?: number;
            pollIntervalMs?: number;
            onProgress?: (variant: ProcessingVariant) => void;
        }
    ): Promise<ProcessingVariant> {
        const maxWait = options?.maxWaitMs || 300000; // 5 minutes
        const pollInterval = options?.pollIntervalMs || 2000; // 2 seconds
        const startTime = Date.now();

        while (true) {
            const variant = await this.getVariant(variantId);

            if (options?.onProgress) {
                options.onProgress(variant);
            }

            if (variant.status === 'completed') {
                return variant;
            }

            if (variant.status === 'failed') {
                throw new RaptorError(`Processing failed: ${variant.error}`);
            }

            if (Date.now() - startTime > maxWait) {
                throw new RaptorError('Processing timeout');
            }

            await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
    }

    /**
     * Helper method to transform backend variant to frontend format
     */
    private transformVariant(
        data: BackendProcessingVariant
    ): ProcessingVariant {
        return {
            id: data.id,
            versionId: data.version_id,
            configHash: data.config_hash,
            config: {
                chunkSize: data.config.chunk_size,
                chunkOverlap: data.config.chunk_overlap,
                strategy:
                    data.config.strategy === 'semantic' ||
                    data.config.strategy === 'recursive'
                        ? data.config.strategy
                        : undefined,
                processImages: data.config.process_images,
                extractSectionNumbers: data.config.extract_section_numbers,
                calculateQualityScores: data.config.calculate_quality_scores,
                minChunkQuality: data.config.min_chunk_quality,
                enableSmartContext: data.config.enable_smart_context,
                tableExtraction: data.config.table_extraction,
                tableContextGeneration: data.config.table_context_generation,
                storeContent: data.config.store_content,
            },
            status: data.status as
                | 'pending'
                | 'processing'
                | 'completed'
                | 'failed',
            error: data.error,
            chunksCount: data.chunks_count,
            totalTokens: data.total_tokens,
            pageCount: data.page_count,
            creditsCharged: data.credits_charged,
            isPrimary: data.is_primary,
            dedupStats: data.dedup_stats
                ? {
                      chunksCreated: data.dedup_stats.chunks_created,
                      chunksReused: data.dedup_stats.chunks_reused,
                      totalChunks: data.dedup_stats.total_chunks,
                      savingsPercent: data.dedup_stats.savings_percent,
                      chunksHighReuse: data.dedup_stats.chunks_high_reuse,
                      chunksPartialReuse: data.dedup_stats.chunks_partial_reuse,
                      chunksFuzzyMatched: data.dedup_stats.chunks_fuzzy_matched,
                      totalSentences: data.dedup_stats.total_sentences,
                      reusedSentences: data.dedup_stats.reused_sentences,
                      newSentences: data.dedup_stats.new_sentences,
                      sentenceReuseRatio: data.dedup_stats.sentence_reuse_ratio,
                      embeddingRecommendations: data.dedup_stats.embedding_recommendations
                          ? {
                                reuse: data.dedup_stats.embedding_recommendations.reuse,
                                considerReuse: data.dedup_stats.embedding_recommendations.consider_reuse,
                                regenerate: data.dedup_stats.embedding_recommendations.regenerate,
                            }
                          : undefined,
                  }
                : undefined,
            retryCount: data.retry_count,
            maxRetries: data.max_retries,
            isRetrying: data.is_retrying,
            inDlq: data.in_dlq,
            createdAt: data.created_at,
            processedAt: data.processed_at,
        };
    }

    /**
     * Helper method to transform backend deletion response to frontend format
     */
    private transformDeletionResponse(
        data: BackendDeletionResponse
    ): DeletionResponse {
        return {
            id: data.id,
            type: data.type,
            status: data.status,
            promoted: data.promoted
                ? {
                      type: data.promoted.type,
                      id: data.promoted.id,
                      versionNumber: data.promoted.version_number,
                      isNowDefault: data.promoted.is_now_default,
                  }
                : data.promoted,
            cascaded: data.cascaded
                ? {
                      type: data.cascaded.type,
                      id: data.cascaded.id,
                      variantsDeleted: data.cascaded.variants_deleted,
                      versionsDeleted: data.cascaded.versions_deleted,
                      chunksDeleted: data.cascaded.chunks_deleted,
                  }
                : data.cascaded,
            deletedAt: data.deleted_at,
        };
    }

    /**
     * Get all duplicate documents (siblings) for a specific document
     *
     * Returns all documents with the same content hash, including the canonical
     * document and all duplicates. Useful for identifying files uploaded multiple
     * times with different names.
     *
     * @example
     * ```typescript
     * const result = await raptor.getDuplicates('document-id');
     * console.log(`Found ${result.count} duplicates`);
     * result.duplicates.forEach(dup => {
     *   console.log(`${dup.filename} (${dup.isCanonical ? 'canonical' : 'duplicate'})`);
     * });
     * ```
     */
    async getDuplicates(
        documentId: string
    ): Promise<DocumentDuplicatesResponse> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}/duplicates`,
            { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to get duplicates: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        const data =
            (await response.json()) as BackendDocumentDuplicatesResponse;

        return {
            documentId: data.document_id,
            duplicates: data.duplicates.map((d) => ({
                id: d.id,
                filename: d.filename,
                isCanonical: d.is_canonical,
                createdAt: d.created_at,
                latestVersionId: d.latest_version_id,
            })),
            count: data.count,
        };
    }

    /**
     * List all duplicate groups for the authenticated user
     *
     * Returns groups of documents with identical content, showing the canonical
     * document and all duplicates. Useful for cleanup and storage management.
     *
     * @example
     * ```typescript
     * const result = await raptor.listAllDuplicates();
     * console.log(`Found ${result.totalGroups} duplicate groups with ${result.totalDuplicates} duplicates`);
     *
     * result.duplicateGroups.forEach(group => {
     *   console.log(`Canonical: ${group.canonicalFilename}`);
     *   console.log(`  ${group.totalCount} duplicates:`);
     *   group.duplicates.forEach(dup => console.log(`    - ${dup.filename}`));
     * });
     * ```
     */
    async listAllDuplicates(): Promise<DuplicatesListResponse> {
        const response = await fetch(
            `${this.baseUrl}/api/documents/duplicates`,
            { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to list duplicates: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        const data = (await response.json()) as BackendDuplicatesListResponse;

        return {
            duplicateGroups: data.duplicate_groups.map((group) => ({
                contentHash: group.content_hash,
                canonicalDocumentId: group.canonical_document_id,
                canonicalFilename: group.canonical_filename,
                duplicates: group.duplicates.map((d) => ({
                    id: d.id,
                    filename: d.filename,
                    isCanonical: d.is_canonical,
                    createdAt: d.created_at,
                    latestVersionId: d.latest_version_id,
                })),
                totalCount: group.total_count,
            })),
            totalGroups: data.total_groups,
            totalDuplicates: data.total_duplicates,
        };
    }

    // ============================================================================
    // Document Lineage & Version Control Methods
    // ============================================================================

    /**
     * Get complete version history for a document lineage
     *
     * Returns all documents in the same lineage (version family), showing the evolution
     * of a document across different content changes. Documents are linked through
     * parent-child relationships across different content_hashes.
     *
     * @param documentId - ID of any document in the lineage
     * @param includeDeleted - Include soft-deleted documents (default: false)
     *
     * @example
     * ```typescript
     * const lineage = await raptor.getDocumentLineage('document-id');
     * console.log(`Found ${lineage.totalVersions} versions in lineage`);
     * lineage.documents.forEach(doc => {
     *   console.log(`${doc.versionLabel || doc.filename} (${doc.similarityScore * 100}% similar)`);
     * });
     * ```
     */
    async getDocumentLineage(
        documentId: string,
        includeDeleted: boolean = false
    ): Promise<DocumentLineageResponse> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        const url = new URL(
            `${this.baseUrl}/api/documents/${documentId}/lineage`
        );
        if (includeDeleted) {
            url.searchParams.set('include_deleted', 'true');
        }

        const response = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${this.apiKey}` },
        });

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to get document lineage: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        const data = (await response.json()) as BackendDocumentLineageResponse;

        return {
            lineageId: data.lineage_id,
            totalVersions: data.total_versions,
            documents: data.documents.map((d) => ({
                id: d.id,
                filename: d.filename,
                contentHash: d.content_hash,
                versionLabel: d.version_label || undefined,
                parentDocumentId: d.parent_document_id || undefined,
                similarityScore: d.similarity_score || undefined,
                createdAt: d.created_at,
                fileSizeBytes: d.file_size_bytes,
                isCurrent: d.is_current,
            })),
        };
    }

    /**
     * Get lineage as a tree structure showing parent-child relationships
     *
     * Returns a hierarchical tree representation of the document lineage,
     * making it easy to visualize version branches and relationships.
     *
     * @param documentId - ID of any document in the lineage
     *
     * @example
     * ```typescript
     * const tree = await raptor.getDocumentLineageTree('document-id');
     * console.log(`Total versions: ${tree.totalVersions}`);
     * // Recursively display tree structure
     * tree.roots.forEach(root => displayTree(root));
     * ```
     */
    async getDocumentLineageTree(
        documentId: string
    ): Promise<DocumentLineageTreeResponse> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}/lineage/tree`,
            { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to get lineage tree: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        return (await response.json()) as DocumentLineageTreeResponse;
    }

    /**
     * Get statistics about a document's lineage
     *
     * Returns aggregate statistics including total versions, oldest/newest versions,
     * total storage, and average similarity scores across the lineage.
     *
     * @param documentId - ID of any document in the lineage
     *
     * @example
     * ```typescript
     * const stats = await raptor.getLineageStats('document-id');
     * console.log(`${stats.totalVersions} versions spanning ${stats.totalSizeBytes / 1024}KB`);
     * console.log(`Average similarity: ${(stats.avgSimilarity * 100).toFixed(1)}%`);
     * ```
     */
    async getLineageStats(documentId: string): Promise<LineageStatsResponse> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}/lineage/stats`,
            { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to get lineage stats: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        return (await response.json()) as LineageStatsResponse;
    }

    /**
     * Find documents similar to the given document
     *
     * Uses chunk overlap analysis to find documents that might be versions
     * of each other. Returns suggestions with similarity scores. Useful for
     * the hybrid approach to linking documents.
     *
     * @param documentId - Document to find similar documents for
     * @param minSimilarity - Minimum similarity score (0.0-1.0, default: 0.7)
     * @param limit - Maximum number of suggestions (default: 10)
     *
     * @example
     * ```typescript
     * const similar = await raptor.findSimilarDocuments('document-id', 0.8);
     * console.log(`Found ${similar.count} similar documents`);
     * similar.suggestions.forEach(s => {
     *   console.log(`${s.filename}: ${(s.similarityScore * 100).toFixed(1)}% similar`);
     * });
     * ```
     */
    async findSimilarDocuments(
        documentId: string,
        minSimilarity: number = 0.7,
        limit: number = 10
    ): Promise<SimilarDocumentsResponse> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        if (minSimilarity < 0 || minSimilarity > 1) {
            throw new RaptorError('minSimilarity must be between 0.0 and 1.0');
        }

        const url = new URL(
            `${this.baseUrl}/api/documents/${documentId}/similar`
        );
        url.searchParams.set('min_similarity', minSimilarity.toString());
        url.searchParams.set('limit', limit.toString());

        const response = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${this.apiKey}` },
        });

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to find similar documents: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        const data = (await response.json()) as BackendSimilarDocumentsResponse;

        return {
            suggestions: data.suggestions.map((s) => ({
                documentId: s.document_id,
                filename: s.filename,
                similarityScore: s.similarity_score,
                createdAt: s.created_at,
                versionLabel: s.version_label || undefined,
            })),
            count: data.count,
        };
    }

    /**
     * Link a document to its parent in version lineage
     *
     * Establishes a parent-child relationship between documents, creating
     * a version lineage. Automatically calculates similarity score based
     * on chunk overlap.
     *
     * @param documentId - Document to link
     * @param parentDocumentId - Parent document ID
     * @param versionLabel - Optional version label (e.g., "v2.0", "draft")
     *
     * @example
     * ```typescript
     * const result = await raptor.linkToParent('new-doc-id', 'parent-doc-id', 'v2.0');
     * console.log(`Linked with ${(result.similarityScore * 100).toFixed(1)}% similarity`);
     * ```
     */
    async linkToParent(
        documentId: string,
        parentDocumentId: string,
        versionLabel?: string
    ): Promise<LinkToParentResponse> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }
        if (!parentDocumentId || !Raptor.isValidUUID(parentDocumentId)) {
            throw new RaptorError(
                `Invalid parent document ID: ${parentDocumentId}`
            );
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}/link-parent`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    parent_document_id: parentDocumentId,
                    version_label: versionLabel,
                }),
            }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to link to parent: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        const data = (await response.json()) as BackendLinkToParentResponse;

        return {
            documentId: data.document_id,
            parentDocumentId: data.parent_document_id,
            lineageId: data.lineage_id,
            similarityScore: data.similarity_score,
            versionLabel: data.version_label || undefined,
        };
    }

    /**
     * Remove a document from its current lineage
     *
     * Unlinks the document from its parent and creates a new independent lineage.
     * Use this to separate documents that were incorrectly linked.
     *
     * @param documentId - Document to unlink
     *
     * @example
     * ```typescript
     * const result = await raptor.unlinkFromLineage('document-id');
     * console.log(`Created new lineage: ${result.newLineageId}`);
     * ```
     */
    async unlinkFromLineage(
        documentId: string
    ): Promise<UnlinkFromLineageResponse> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}/unlink`,
            {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${this.apiKey}` },
            }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to unlink from lineage: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        return (await response.json()) as UnlinkFromLineageResponse;
    }

    /**
     * Compare two documents and return detailed diff
     *
     * Analyzes chunk-level differences between two documents, showing what
     * content was added, removed, or remained unchanged. Includes similarity
     * score and human-readable summary.
     *
     * @param doc1Id - First document ID
     * @param doc2Id - Second document ID
     *
     * @example
     * ```typescript
     * const diff = await raptor.compareDocuments('doc1-id', 'doc2-id');
     * console.log(diff.summary);
     * console.log(`Similarity: ${(diff.diff.similarityScore * 100).toFixed(1)}%`);
     * console.log(`Added: ${diff.diff.addedCount} chunks`);
     * console.log(`Removed: ${diff.diff.removedCount} chunks`);
     * ```
     */
    async compareDocuments(
        doc1Id: string,
        doc2Id: string
    ): Promise<DocumentComparisonResponse> {
        if (!doc1Id || !Raptor.isValidUUID(doc1Id)) {
            throw new RaptorError(`Invalid document ID: ${doc1Id}`);
        }
        if (!doc2Id || !Raptor.isValidUUID(doc2Id)) {
            throw new RaptorError(`Invalid document ID: ${doc2Id}`);
        }

        const url = new URL(`${this.baseUrl}/api/documents/compare`);
        url.searchParams.set('doc1', doc1Id);
        url.searchParams.set('doc2', doc2Id);

        const response = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${this.apiKey}` },
        });

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to compare documents: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        interface BackendDocumentComparisonResponse {
            similarity_score: number;
            document_1: {
                id: string;
                filename: string;
                content_hash: string;
                created_at: string;
                total_chunks: number;
            };
            document_2: {
                id: string;
                filename: string;
                content_hash: string;
                created_at: string;
                total_chunks: number;
            };
            diff: {
                added_chunks: any[];
                removed_chunks: any[];
                unchanged_chunks: any[];
                added_count: number;
                removed_count: number;
                unchanged_count: number;
                similarity_score: number;
            };
            summary: string;
        }

        const data = (await response.json()) as BackendDocumentComparisonResponse;

        // Transform snake_case API response to camelCase SDK interface
        return {
            similarityScore: data.similarity_score,
            document_1: {
                id: data.document_1.id,
                filename: data.document_1.filename,
                contentHash: data.document_1.content_hash,
                createdAt: data.document_1.created_at,
                totalChunks: data.document_1.total_chunks,
            },
            document_2: {
                id: data.document_2.id,
                filename: data.document_2.filename,
                contentHash: data.document_2.content_hash,
                createdAt: data.document_2.created_at,
                totalChunks: data.document_2.total_chunks,
            },
            diff: {
                addedChunks: data.diff.added_chunks,
                removedChunks: data.diff.removed_chunks,
                unchangedChunks: data.diff.unchanged_chunks,
                addedCount: data.diff.added_count,
                removedCount: data.diff.removed_count,
                unchangedCount: data.diff.unchanged_count,
                similarityScore: data.diff.similarity_score,
            },
            summary: data.summary,
        };
    }

    /**
     * Get changelog for entire lineage showing version-to-version changes
     *
     * Returns a list of change summaries between consecutive versions in
     * a lineage, useful for displaying document evolution over time.
     *
     * @param documentId - ID of any document in the lineage
     *
     * @example
     * ```typescript
     * const result = await raptor.getLineageChangelog('document-id');
     * result.changelogs.forEach(change => {
     *   console.log(`${change.versionTransition.fromLabel} → ${change.versionTransition.toLabel}`);
     *   console.log(`  Additions: ${change.changelog.additions.count}`);
     *   console.log(`  Removals: ${change.changelog.removals.count}`);
     * });
     * ```
     */
    async getLineageChangelog(
        documentId: string
    ): Promise<LineageChangelogResponse> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}/changelog`,
            { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to get lineage changelog: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        return (await response.json()) as LineageChangelogResponse;
    }

    /**
     * Delete a specific version of a document
     *
     * Removes a version from the document lineage. If this is the last version,
     * the entire document will be deleted. If a variant is promoted to maintain
     * document continuity, promotion details will be included in the response.
     *
     * @param documentId - Document ID
     * @param versionNumber - Version number to delete
     *
     * @example
     * ```typescript
     * const result = await raptor.deleteVersion('document-id', 2);
     * console.log(`Deleted version 2 (${result.status})`);
     * if (result.promoted) {
     *   console.log(`Promoted ${result.promoted.type}: ${result.promoted.id}`);
     * }
     * if (result.cascaded) {
     *   console.log(`Cascaded deletion of ${result.cascaded.variantsDeleted} variants`);
     * }
     * ```
     */
    async deleteVersion(
        documentId: string,
        versionNumber: number
    ): Promise<DeletionResponse> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        if (versionNumber < 1) {
            throw new RaptorError('Version number must be >= 1');
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}/versions/${versionNumber}`,
            {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${this.apiKey}` },
            }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to delete version: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        const data = (await response.json()) as BackendDeletionResponse;
        return this.transformDeletionResponse(data);
    }

    /**
     * Revert document to a previous version
     *
     * Creates a new version that's a copy of the specified previous version,
     * effectively "undoing" changes. The reverted-from version remains in history.
     *
     * @param documentId - Document ID
     * @param versionNumber - Version number to revert to
     *
     * @example
     * ```typescript
     * const result = await raptor.revertToVersion('document-id', 2);
     * console.log(`Reverted to version 2, created new version ${result.newVersionNumber}`);
     * ```
     */
    async revertToVersion(
        documentId: string,
        versionNumber: number
    ): Promise<RevertToVersionResponse> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        if (versionNumber < 1) {
            throw new RaptorError('Version number must be >= 1');
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}/revert/${versionNumber}`,
            {
                method: 'POST',
                headers: { Authorization: `Bearer ${this.apiKey}` },
            }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to revert to version: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        return (await response.json()) as RevertToVersionResponse;
    }

    /**
     * Set a specific version as the default/current version
     *
     * Changes which version is returned by default when accessing the document.
     * Useful for switching between different versions without creating new ones.
     *
     * @param documentId - Document ID
     * @param versionNumber - Version number to set as default
     *
     * @example
     * ```typescript
     * await raptor.setDefaultVersion('document-id', 3);
     * console.log('Version 3 is now the default');
     * ```
     */
    async setDefaultVersion(
        documentId: string,
        versionNumber: number
    ): Promise<SetDefaultVersionResponse> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        if (versionNumber < 1) {
            throw new RaptorError('Version number must be >= 1');
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}/default-version`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    version_number: versionNumber,
                }),
            }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to set default version: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        return (await response.json()) as SetDefaultVersionResponse;
    }

    /**
     * Update the version label for a document
     *
     * Sets or removes a human-readable version label (e.g., "v2.0", "draft", "final").
     * Labels make it easier to identify specific versions in the lineage.
     *
     * @param documentId - Document ID
     * @param versionLabel - New version label (null to remove)
     *
     * @example
     * ```typescript
     * await raptor.updateVersionLabel('document-id', 'v2.0-final');
     * console.log('Version label updated');
     * ```
     */
    async updateVersionLabel(
        documentId: string,
        versionLabel: string | null
    ): Promise<UpdateVersionLabelResponse> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}/version-label`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    version_label: versionLabel,
                }),
            }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to update version label: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        return (await response.json()) as UpdateVersionLabelResponse;
    }

    /**
     * List all versions of a document
     *
     * Returns all processing versions (same content, different configs).
     *
     * @example
     * ```typescript
     * const versions = await raptor.listDocumentVersions('doc-id');
     * versions.forEach(v => {
     *   console.log(`Version ${v.version_number}: ${v.created_at}`);
     * });
     * ```
     */
    async listDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
        if (!documentId || !Raptor.isValidUUID(documentId)) {
            throw new RaptorError(`Invalid document ID: ${documentId}`);
        }

        const response = await fetch(
            `${this.baseUrl}/api/documents/${documentId}/versions`,
            { headers: { Authorization: `Bearer ${this.apiKey}` } }
        );

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to list document versions: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        interface BackendDocumentVersionsResponse {
            versions: BackendDocumentVersion[];
        }

        const data = (await response.json()) as BackendDocumentVersionsResponse;
        return data.versions.map((v) => ({
            id: v.id,
            documentId: v.document_id,
            versionNumber: v.version_number,
            parentVersionId: v.parent_version_id,
            filename: v.filename,
            mimeType: v.mime_type,
            fileSizeBytes: v.file_size_bytes,
            contentHash: v.content_hash,
            createdAt: v.created_at,
            variants: v.variants.map((variant) =>
                this.transformVariant(variant)
            ),
        }));
    }

    /**
     * List documents with pagination
     *
     * @example
     * ```typescript
     * const documents = await raptor.listDocuments({ limit: 10, offset: 0 });
     * documents.forEach(doc => {
     *   console.log(`${doc.filename} - ${doc.status}`);
     * });
     * ```
     */
    async listDocuments(
        options: ListDocumentsOptions = {}
    ): Promise<DocumentInfo[]> {
        const { limit = 20, offset = 0 } = options;

        // Validate pagination params
        if (limit < 1 || limit > 100) {
            throw new RaptorError('Limit must be between 1 and 100');
        }

        if (offset < 0) {
            throw new RaptorError('Offset must be non-negative');
        }

        let response;
        try {
            response = await fetch(
                `${this.baseUrl}/api/documents?limit=${limit}&offset=${offset}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                }
            );
        } catch (error) {
            throw new RaptorError(
                `Network error while listing documents: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to list documents: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        let data: BackendDocumentInfo[];
        try {
            data = (await response.json()) as BackendDocumentInfo[];
        } catch (error) {
            throw new RaptorError(
                `Failed to parse list documents response: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }

        return data.map((doc) => ({
            id: doc.id,
            filename: doc.filename,
            mimeType: doc.mime_type,
            fileSizeBytes: doc.file_size_bytes,
            status: doc.status,
            chunksCount: doc.chunks_count,
            totalTokens: doc.total_tokens,
            createdAt: doc.created_at,
            storeContent: doc.store_content,
            deletedAt: doc.deleted_at,
            extractorVersion: doc.extractor_version,
        }));
    }

    /**
     * Get user's auto-link settings
     *
     * Retrieves the current auto-link preferences for the authenticated user.
     *
     * @example
     * ```typescript
     * const settings = await raptor.getAutoLinkSettings();
     * console.log(`Auto-link enabled: ${settings.autoLinkEnabled}`);
     * console.log(`Threshold: ${settings.autoLinkThreshold}`);
     * ```
     */
    async getAutoLinkSettings(): Promise<AutoLinkSettings> {
        let response;
        try {
            response = await fetch(
                `${this.baseUrl}/api/users/me/auto-link-settings`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                }
            );
        } catch (error) {
            throw new RaptorError(
                `Network error while fetching auto-link settings: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to get auto-link settings: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        let data: { auto_link_enabled: boolean; auto_link_threshold: number };
        try {
            data = (await response.json()) as {
                auto_link_enabled: boolean;
                auto_link_threshold: number;
            };
        } catch (error) {
            throw new RaptorError(
                `Failed to parse auto-link settings response: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }

        return {
            autoLinkEnabled: data.auto_link_enabled,
            autoLinkThreshold: data.auto_link_threshold,
        };
    }

    /**
     * Update user's auto-link settings
     *
     * Updates the auto-link preferences for the authenticated user.
     *
     * @example
     * ```typescript
     * await raptor.updateAutoLinkSettings({
     *   autoLinkEnabled: true,
     *   autoLinkThreshold: 0.90
     * });
     * ```
     */
    async updateAutoLinkSettings(
        settings: AutoLinkSettingsUpdate
    ): Promise<AutoLinkSettings> {
        const payload: {
            auto_link_enabled?: boolean;
            auto_link_threshold?: number;
        } = {};

        if (settings.autoLinkEnabled !== undefined) {
            payload.auto_link_enabled = settings.autoLinkEnabled;
        }

        if (settings.autoLinkThreshold !== undefined) {
            if (
                settings.autoLinkThreshold < 0 ||
                settings.autoLinkThreshold > 1
            ) {
                throw new RaptorError(
                    'autoLinkThreshold must be between 0.0 and 1.0'
                );
            }
            payload.auto_link_threshold = settings.autoLinkThreshold;
        }

        let response;
        try {
            response = await fetch(
                `${this.baseUrl}/api/users/me/auto-link-settings`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );
        } catch (error) {
            throw new RaptorError(
                `Network error while updating auto-link settings: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to update auto-link settings: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        let data: { auto_link_enabled: boolean; auto_link_threshold: number };
        try {
            data = (await response.json()) as {
                auto_link_enabled: boolean;
                auto_link_threshold: number;
            };
        } catch (error) {
            throw new RaptorError(
                `Failed to parse auto-link settings response: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }

        return {
            autoLinkEnabled: data.auto_link_enabled,
            autoLinkThreshold: data.auto_link_threshold,
        };
    }

    /**
     * Delete a document
     *
     * Permanently removes the document and all associated versions, variants, and chunks.
     * Returns detailed information about the deletion including cascade statistics.
     *
     * @example
     * ```typescript
     * const result = await raptor.deleteDocument('doc-id-123');
     * console.log(`Document deleted (${result.status})`);
     * if (result.cascaded) {
     *   console.log(`Deleted ${result.cascaded.versionsDeleted} versions`);
     *   console.log(`Deleted ${result.cascaded.variantsDeleted} variants`);
     *   console.log(`Deleted ${result.cascaded.chunksDeleted} chunks`);
     * }
     * ```
     */
    async deleteDocument(documentId: string): Promise<DeletionResponse> {
        if (!documentId || documentId.trim().length === 0) {
            throw new RaptorError('Document ID is required');
        }

        if (!Raptor.isValidUUID(documentId.trim())) {
            throw new RaptorError(
                `Invalid document ID format: ${documentId}. Expected UUID format.`
            );
        }

        let response;
        try {
            response = await fetch(
                `${this.baseUrl}/api/documents/${documentId.trim()}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                }
            );
        } catch (error) {
            throw new RaptorError(
                `Network error while deleting document: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }

        if (!response.ok) {
            const error: unknown = await response.json().catch(() => ({}));
            const errorDetail = hasDetail(error) ? error.detail : undefined;
            throw new RaptorAPIError(
                `Failed to delete document: ${errorDetail || response.statusText}`,
                response.status,
                error
            );
        }

        const data = (await response.json()) as BackendDeletionResponse;
        return this.transformDeletionResponse(data);
    }
}
