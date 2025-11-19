/**
 * React Hooks for Raptor SDK
 *
 * Optional React integration for managing versions, processing status, and uploads
 */

import { useState, useEffect, useCallback } from 'react';
import type Raptor from './index';
import type {
    DocumentVersion,
    ProcessingVariant,
    ProcessResult,
    UploadResult,
    ProcessingConfig,
    DeletionResponse,
    AutoLinkSettings,
    AutoLinkSettingsUpdate,
} from './index';

/**
 * Hook for fetching and managing document versions
 *
 * @example
 * ```typescript
 * const { versions, loading, error } = useRaptorVersions(client, documentId);
 * ```
 */
export function useRaptorVersions(
    client: Raptor,
    documentId: string | null
) {
    const [versions, setVersions] = useState<DocumentVersion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!documentId) return;

        setLoading(true);
        client
            .listVersions(documentId)
            .then(setVersions)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [client, documentId]);

    return { versions, loading, error };
}

/**
 * Hook for polling processing status of a variant
 *
 * @example
 * ```typescript
 * const { variant, loading, error } = useProcessingStatus(client, variantId);
 * ```
 */
export function useProcessingStatus(
    client: Raptor,
    variantId: string | null
) {
    const [variant, setVariant] = useState<ProcessingVariant | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!variantId) return;

        let cancelled = false;
        let timeoutId: NodeJS.Timeout | null = null;
        setLoading(true);

        const poll = async () => {
            if (cancelled) return;

            try {
                const v = await client.getVariant(variantId);
                if (cancelled) return;

                setVariant(v);

                if (v.status === 'completed' || v.status === 'failed') {
                    setLoading(false);
                    return;
                }

                // Continue polling
                timeoutId = setTimeout(poll, 2000);
            } catch (err) {
                if (cancelled) return;
                const error = err instanceof Error ? err : new Error('Unknown error');
                setError(error.message);
                setLoading(false);
            }
        };

        poll();

        return () => {
            cancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [client, variantId]);

    return { variant, loading, error };
}

/**
 * Hook for uploading documents with progress tracking
 *
 * @example
 * ```typescript
 * const { upload, uploading, result, error } = useUpload(client);
 *
 * const handleUpload = async (file: File) => {
 *   const result = await upload(file, { chunkSize: 1024 });
 *   console.log('Upload complete:', result);
 * };
 * ```
 */
export function useUpload(client: Raptor) {
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<ProcessResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const upload = useCallback(
        async (file: File, config?: ProcessingConfig) => {
            setUploading(true);
            setError(null);

            try {
                const res = await client.process(file, config);
                setResult(res);
                return res;
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error');
                setError(error.message);
                throw err;
            } finally {
                setUploading(false);
            }
        },
        [client]
    );

    return { upload, uploading, result, error };
}

/**
 * Hook for reprocessing documents with different configs
 *
 * @example
 * ```typescript
 * const { reprocess, loading, result, error } = useReprocess(client);
 *
 * const handleReprocess = async () => {
 *   const result = await reprocess('doc-id', { chunkSize: 256 });
 *   console.log('Reprocess started:', result);
 * };
 * ```
 */
export function useReprocess(client: Raptor) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const reprocess = useCallback(
        async (documentId: string, config: ProcessingConfig) => {
            setLoading(true);
            setError(null);

            try {
                const res = await client.reprocess(documentId, config);
                setResult(res);
                return res;
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error');
                setError(error.message);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [client]
    );

    return { reprocess, loading, result, error };
}

/**
 * Hook for waiting for processing to complete with progress updates
 *
 * @example
 * ```typescript
 * const { variant, progress, error } = useWaitForProcessing(client, variantId);
 * ```
 */
export function useWaitForProcessing(
    client: Raptor,
    variantId: string | null,
    options?: {
        maxWaitMs?: number;
        pollIntervalMs?: number;
    }
) {
    const [variant, setVariant] = useState<ProcessingVariant | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!variantId) return;

        client
            .waitForProcessing(variantId, {
                ...options,
                onProgress: (v) => {
                    setVariant(v);
                    // Estimate progress based on status
                    if (v.status === 'completed') setProgress(100);
                    else if (v.status === 'processing') setProgress(50);
                    else setProgress(25);
                },
            })
            .then((v) => {
                setVariant(v);
                setProgress(100);
            })
            .catch((err) => setError(err.message));
    }, [client, variantId, options?.maxWaitMs, options?.pollIntervalMs]);

    return { variant, progress, error };
}

/**
 * Hook for deleting documents
 *
 * @example
 * ```typescript
 * const { deleteDoc, deleting, result, error } = useDeleteDocument(client);
 *
 * const handleDelete = async () => {
 *   try {
 *     const result = await deleteDoc('doc-123');
 *     console.log('Document deleted:', result.message);
 *   } catch (err) {
 *     console.error('Delete failed:', err);
 *   }
 * };
 * ```
 */
export function useDeleteDocument(client: Raptor) {
    const [deleting, setDeleting] = useState(false);
    const [result, setResult] = useState<DeletionResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const deleteDoc = useCallback(
        async (documentId: string) => {
            setDeleting(true);
            setError(null);
            try {
                const res = await client.deleteDocument(documentId);
                setResult(res);
                return res;
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error');
                setError(error.message);
                throw err;
            } finally {
                setDeleting(false);
            }
        },
        [client]
    );

    return { deleteDoc, deleting, result, error };
}

/**
 * Hook for deleting processing variants
 *
 * @example
 * ```typescript
 * const { deleteVariant, deleting, result, error } = useDeleteVariant(client);
 *
 * const handleDelete = async () => {
 *   try {
 *     const result = await deleteVariant('variant-456');
 *     console.log('Variant deleted:', result.message);
 *   } catch (err) {
 *     console.error('Delete failed:', err);
 *   }
 * };
 * ```
 */
export function useDeleteVariant(client: Raptor) {
    const [deleting, setDeleting] = useState(false);
    const [result, setResult] = useState<DeletionResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const deleteVariant = useCallback(
        async (variantId: string) => {
            setDeleting(true);
            setError(null);
            try {
                const res = await client.deleteVariant(variantId);
                setResult(res);
                return res;
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error');
                setError(error.message);
                throw err;
            } finally {
                setDeleting(false);
            }
        },
        [client]
    );

    return { deleteVariant, deleting, result, error };
}

/**
 * Hook for managing auto-link settings
 *
 * @example
 * ```typescript
 * const { settings, loading, error, updateSettings } = useAutoLinkSettings(client);
 *
 * const handleUpdate = async () => {
 *   await updateSettings({ autoLinkEnabled: true, autoLinkThreshold: 0.90 });
 * };
 * ```
 */
export function useAutoLinkSettings(client: Raptor) {
    const [settings, setSettings] = useState<AutoLinkSettings | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await client.getAutoLinkSettings();
            setSettings(data);
            return data;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [client]);

    const updateSettings = useCallback(
        async (update: AutoLinkSettingsUpdate) => {
            setLoading(true);
            setError(null);
            try {
                const data = await client.updateAutoLinkSettings(update);
                setSettings(data);
                return data;
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error');
                setError(error.message);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [client]
    );

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return { settings, loading, error, updateSettings, refetch: fetchSettings };
}
