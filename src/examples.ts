/**
 * Usage Examples for Raptor SDK with Version Control
 *
 * These examples demonstrate the new version control and variant features
 */

import Raptor from './index';

// Initialize the client
const client = new Raptor({ apiKey: 'rd_your_api_key' });

/**
 * Example 1: Simple upload with default configuration
 */
async function example1() {
    const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
    });

    const result = await client.process(file);
    console.log('Uploaded:', result);
    // { documentId, chunks, metadata }

    console.log(`Processing complete: ${result.chunks.length} chunks`);
}

/**
 * Example 2: Upload with custom processing configuration
 */
async function example2() {
    const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
    });

    const result = await client.process(file, {
        chunkSize: 1024,
        strategy: 'recursive',
        tableExtraction: true,
        processImages: true,
    });

    console.log('Uploaded with custom config:', result);
}

/**
 * Example 3: Upload and wait for processing with progress callback
 */
async function example3() {
    const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
    });

    // Using processStream for progress updates
    for await (const progress of client.processStream(file, {
        chunkSize: 512,
        strategy: 'semantic',
    })) {
        console.log(
            `${progress.stage}: ${progress.percent}% - ${progress.message}`
        );
        if (progress.variantId) {
            console.log(`Variant ID: ${progress.variantId}`);
        }
    }
}

/**
 * Example 4: Reprocess existing document with different strategy
 */
async function example4() {
    const documentId = 'doc-id-here';

    // Reprocess with different chunking strategy
    const result = await client.reprocess(documentId, {
        chunkSize: 256,
        strategy: 'recursive',
        tableExtraction: false,
    });

    console.log('Reprocessing started:', result);
    console.log(`New variant: ${result.variantId}`);
    console.log(`Is new variant: ${result.isNewVariant}`);
    console.log(`Is new version: ${result.isNewVersion}`);

    // Wait for reprocessing to complete
    const variant = await client.waitForProcessing(result.variantId, {
        onProgress: (v) => console.log(`Status: ${v.status}`),
    });

    console.log(`Reprocessing complete: ${variant.chunksCount} chunks`);
}

/**
 * Example 5: List all versions and variants for a document
 */
async function example5() {
    const documentId = 'doc-id-here';

    const versions = await client.listVersions(documentId);

    for (const version of versions) {
        console.log(`\nVersion ${version.versionNumber}:`);
        console.log(`  Filename: ${version.filename}`);
        console.log(`  Created: ${version.createdAt}`);
        console.log(`  Variants: ${version.variants.length}`);

        for (const variant of version.variants) {
            console.log(`\n  Variant ${variant.id}:`);
            console.log(`    Strategy: ${variant.config.strategy}`);
            console.log(`    Chunk Size: ${variant.config.chunkSize}`);
            console.log(`    Chunks: ${variant.chunksCount}`);
            console.log(`    Status: ${variant.status}`);
            console.log(`    Primary: ${variant.isPrimary}`);

            if (variant.dedupStats) {
                console.log(
                    `    Dedup Savings: ${variant.dedupStats.savingsPercent}%`
                );
                console.log(
                    `    Chunks Created: ${variant.dedupStats.chunksCreated}`
                );
                console.log(
                    `    Chunks Reused: ${variant.dedupStats.chunksReused}`
                );
            }
        }
    }
}

/**
 * Example 6: Get a specific version
 */
async function example6() {
    const documentId = 'doc-id-here';
    const versionNumber = 2;

    const version = await client.getVersion(documentId, versionNumber);

    console.log(`Version ${version.versionNumber}:`);
    console.log(`  Filename: ${version.filename}`);
    console.log(`  Content Hash: ${version.contentHash}`);
    console.log(`  Variants: ${version.variants.length}`);
}

/**
 * Example 8: Compare results from different variants
 */
async function example8() {
    const documentId = 'doc-id-here';
    const versions = await client.listVersions(documentId);
    const latestVersion = versions[versions.length - 1];

    if (!latestVersion) {
        console.log('No versions found');
        return;
    }

    console.log(
        `Comparing variants for version ${latestVersion.versionNumber}:`
    );

    for (const variant of latestVersion.variants) {
        const chunks = await client.getChunks(variant.id, { limit: 10 });

        console.log(`\nVariant ${variant.id}:`);
        console.log(`  Strategy: ${variant.config.strategy}`);
        console.log(`  Chunk size: ${variant.config.chunkSize}`);
        console.log(`  Total chunks: ${variant.chunksCount}`);
        console.log(
            `  Sample chunk: ${chunks.chunks[0]?.text?.substring(0, 100)}...`
        );
    }
}

/**
 * Example 9: Cancel processing
 */
async function example9() {
    const file = new File(['content'], 'large-document.pdf', {
        type: 'application/pdf',
    });

    // Start processing
    const result = await client.process(file, { wait: false });
    console.log('Processing started:', result.documentId);

    // Simulate user cancellation after 5 seconds
    setTimeout(async () => {
        // Note: We'd need the variant ID here, which isn't returned from process() with wait: false
        // This is a conceptual example
        // await client.cancelProcessing(variantId);
        console.log('Processing cancelled');
    }, 5000);
}

/**
 * Example 10: Get document with smart defaults
 */
async function example10() {
    const documentId = 'doc-id-here';

    // Get latest version, primary variant (default)
    const doc1 = await client.getDocument(documentId);
    console.log('Latest version:', doc1.versionNumber);

    // Get specific version
    const doc2 = await client.getDocument(documentId, { version: 1 });
    console.log('Version 1:', doc2.versionNumber);

    // Get specific variant
    const doc3 = await client.getDocument(documentId, {
        variantId: 'specific-variant-id',
    });
    console.log('Specific variant:', doc3.variants[0]?.id);
}

/**
 * Example 11: Monitor processing with variant status
 */
async function example11() {
    const variantId = 'variant-id-here';

    const variant = await client.getVariant(variantId);

    console.log('Variant Status:', variant.status);
    console.log('Chunks Count:', variant.chunksCount);
    console.log('Total Tokens:', variant.totalTokens);
    console.log('Credits Charged:', variant.creditsCharged);

    if (variant.status === 'failed') {
        console.error('Processing failed:', variant.error);
    }
}

/**
 * Example 12: A/B test different chunking strategies
 */
async function example12() {
    const documentId = 'doc-id-here';

    // Create multiple variants with different strategies
    const strategies: Array<'semantic' | 'recursive'> = [
        'semantic',
        'recursive',
    ];

    for (const strategy of strategies) {
        const result = await client.reprocess(documentId, {
            strategy,
            chunkSize: 512,
        });

        console.log(`Created ${strategy} variant: ${result.variantId}`);

        // Wait for completion
        const variant = await client.waitForProcessing(result.variantId);

        console.log(`${strategy}:`);
        console.log(`  Chunks: ${variant.chunksCount}`);
        console.log(`  Tokens: ${variant.totalTokens}`);
    }

    console.log(
        '\nYou can now use getChunks() on each variant to compare the chunking results.'
    );
}

/**
 * Example 13: Handle duplicate file uploads
 */
async function example13() {
    const file = new File(['content'], 'contract.pdf', {
        type: 'application/pdf',
    });

    // Upload file for the first time
    const result1 = await client.process(file);
    console.log('First upload:', {
        documentId: result1.documentId,
        isDuplicate: false,
    });

    // Upload the same file again (with different filename)
    const file2 = new File(['content'], 'contract-copy.pdf', {
        type: 'application/pdf',
    });
    const result2 = await client.process(file2);

    // Check if it's a duplicate
    if (result2.isDuplicate) {
        console.log('Duplicate detected!');
        console.log(`Canonical document: ${result2.canonicalDocumentId}`);
        console.log(`Processing skipped: ${result2.processingSkipped}`);
        console.log(`Cost saved: ${result2.costSaved} credits`);
    } else {
        console.log('New unique document');
    }
}

/**
 * Example 14: Find all duplicates of a specific document
 */
async function example14() {
    const documentId = 'doc-id-here';

    const result = await client.getDuplicates(documentId);

    console.log(`Found ${result.count} documents with same content:`);

    result.duplicates.forEach((doc) => {
        console.log(`\n  ${doc.filename}`);
        console.log(`    ID: ${doc.id}`);
        console.log(
            `    Type: ${doc.isCanonical ? 'CANONICAL (original)' : 'DUPLICATE'}`
        );
        console.log(`    Created: ${doc.createdAt}`);
    });
}

/**
 * Example 15: List all duplicate groups for cleanup
 */
async function example15() {
    const result = await client.listAllDuplicates();

    console.log(`Found ${result.totalGroups} duplicate groups`);
    console.log(`Total duplicate files: ${result.totalDuplicates}`);

    result.duplicateGroups.forEach((group) => {
        console.log(`\nCanonical: ${group.canonicalFilename}`);
        console.log(`  Content Hash: ${group.contentHash.substring(0, 16)}...`);
        console.log(`  ${group.totalCount} duplicate(s):`);

        group.duplicates.forEach((dup) => {
            console.log(`    - ${dup.filename} (${dup.id})`);
            console.log(`      Uploaded: ${dup.createdAt}`);
        });
    });
}

/**
 * Example 16: Duplicate detection with upload monitoring
 */
async function example16() {
    const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
    });

    const result = await client.process(file);

    // Check all duplicate-related fields
    if (result.isDuplicate) {
        console.log('✓ Duplicate detected - zero cost!');
        console.log(`  Linked to canonical: ${result.canonicalDocumentId}`);
        console.log(`  Credits saved: ${result.costSaved}`);
    } else if (result.existingMatch) {
        console.log('✓ Exact match found (same content + config)');
        console.log('  Reusing existing variant');
    } else if (result.deduplicationAvailable) {
        console.log('✓ New variant created');
        console.log('  Chunk deduplication available from previous versions');
    } else {
        console.log('✓ Brand new document');
    }
}

/**
 * Example 17: Clean up duplicate files
 */
async function example17() {
    const result = await client.listAllDuplicates();

    console.log(`Cleaning up ${result.totalDuplicates} duplicate files...\n`);

    for (const group of result.duplicateGroups) {
        console.log(`Canonical: ${group.canonicalFilename}`);

        // Keep canonical, delete duplicates
        for (const duplicate of group.duplicates) {
            console.log(`  Deleting duplicate: ${duplicate.filename}`);
            await client.deleteDocument(duplicate.id);
        }
    }

    console.log('\nCleanup complete!');
}

/**
 * Example 18: Delete a variant
 * Demonstrates deleting a specific variant and understanding promotion logic
 */
async function example18() {
    const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
    });

    const doc = await client.process(file);

    // Create another variant
    const variant2 = await client.reprocess(doc.documentId, {
        chunkSize: 256,
        strategy: 'recursive',
    });

    // Delete the second variant
    const deleteResult = await client.deleteVariant(variant2.variantId);
    console.log(`Deletion status: ${deleteResult.status}`);
    console.log(`Deleted at: ${deleteResult.deletedAt}`);

    if (deleteResult.promoted) {
        console.log(`Variant ${deleteResult.promoted.id} was promoted`);
        console.log(`Now default: ${deleteResult.promoted.isNowDefault}`);
    }
}

/**
 * Example 19: Delete a version
 * Demonstrates version deletion with automatic promotion
 */
async function example19() {
    const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
    });

    const doc = await client.process(file, { wait: true });

    // Upload a new version
    const file2 = new File(['updated content'], 'document_v2.pdf', {
        type: 'application/pdf',
    });
    await client.process(file2, { wait: true });

    // Delete the first version
    const deleteResult = await client.deleteVersion(doc.documentId, 1);
    console.log(`Deletion status: ${deleteResult.status}`);

    if (deleteResult.promoted) {
        console.log(
            `Version ${deleteResult.promoted.versionNumber} promoted to latest`
        );
    }
}

/**
 * Example 20: Delete an entire document
 * Demonstrates cascading deletion of all versions and variants
 */
async function example20() {
    const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
    });

    const doc = await client.process(file);

    // Create multiple variants
    await client.reprocess(doc.documentId, { chunkSize: 256 });
    await client.reprocess(doc.documentId, { chunkSize: 1024 });

    // Delete entire document
    const deleteResult = await client.deleteDocument(doc.documentId);
    console.log(`Deletion status: ${deleteResult.status}`);
    console.log(`Cascade information:`);
    console.log(`  Variants deleted: ${deleteResult.cascaded?.variantsDeleted}`);
    console.log(`  Versions deleted: ${deleteResult.cascaded?.versionsDeleted}`);
    console.log(`  Chunks deleted: ${deleteResult.cascaded?.chunksDeleted}`);
}

/**
 * Example 21: Comprehensive duplicate statistics
 */
async function example21() {
    const allDocuments = await client.listDocuments({ limit: 1000 });
    const duplicatesResult = await client.listAllDuplicates();

    const totalDocuments = allDocuments.length;
    const totalDuplicates = duplicatesResult.totalDuplicates;
    const canonicalCount = totalDocuments - totalDuplicates;
    const duplicatePercentage = (
        (totalDuplicates / totalDocuments) *
        100
    ).toFixed(2);

    console.log('=== Duplicate Statistics ===');
    console.log(`Total documents: ${totalDocuments}`);
    console.log(`Canonical (unique) files: ${canonicalCount}`);
    console.log(`Duplicate files: ${totalDuplicates}`);
    console.log(`Duplicate percentage: ${duplicatePercentage}%`);
    console.log(`\nDuplicate groups: ${duplicatesResult.totalGroups}`);

    // Calculate storage savings
    const avgFileSize = 1024 * 1024; // 1MB estimate
    const savedBytes = totalDuplicates * avgFileSize;
    const savedMB = (savedBytes / (1024 * 1024)).toFixed(2);

    console.log(`\nEstimated storage saved: ${savedMB} MB`);
}

/**
 * Example 22: Detect duplicates before upload (using hash)
 */
async function example22() {
    const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
    });

    // Upload and check response
    const result = await client.process(file, { wait: false });

    console.log('Upload initiated');
    console.log(`Document ID: ${result.documentId}`);
    console.log(`Variant ID: ${result.variantId}`);

    // If it's a duplicate, we can immediately notify the user
    if (result.isDuplicate && result.canonicalDocumentId) {
        console.log('\n⚠️  Duplicate file detected!');
        console.log('This file has already been uploaded.');
        console.log(`Original document ID: ${result.canonicalDocumentId}`);
        console.log('No additional processing or charges applied.');

        // Get details about the canonical document
        const duplicates = await client.getDuplicates(
            result.canonicalDocumentId
        );
        console.log(
            `\nThis content has been uploaded ${duplicates.count} time(s):`
        );
        duplicates.duplicates.forEach((d) => {
            console.log(`  - ${d.filename} (${d.createdAt})`);
        });
    }
}

// Export all examples
export {
    example1,
    example10,
    example11,
    example12,
    example13,
    example14,
    example15,
    example16,
    example17,
    example18,
    example19,
    example2,
    example20,
    example21,
    example22,
    example3,
    example4,
    example5,
    example6,
    example8,
    example9,
};
