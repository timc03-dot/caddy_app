#!/usr/bin/env node

/**
 * Standalone OpenAlex Authors Pagination Script
 *
 * This script fetches all pages of authors from the OpenAlex API based on a filter.
 *
 * Usage:
 *   node openalex_pagination.js
 *
 * Or with custom parameters:
 *   node openalex_pagination.js --filter="last_known_institutions.id:I97018004,has_orcid:true" --per-page=200
 */

const axios = require('axios');

async function fetchAllOpenAlexAuthors(filter, perPage = 200) {
  let allAuthors = [];
  let nextCursor = '*'; // OpenAlex uses '*' for the first page
  let pageCount = 0;
  let hasMore = true;

  console.log('Starting OpenAlex authors pagination...');
  console.log(`Filter: ${filter}`);
  console.log(`Per page: ${perPage}\n`);

  const startTime = Date.now();

  while (hasMore) {
    try {
      const url = `https://api.openalex.org/authors?filter=${encodeURIComponent(filter)}&per-page=${perPage}&cursor=${nextCursor}`;

      console.log(`Fetching page ${pageCount + 1}...`);

      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OpenAlexPaginationScript/1.0 (mailto:research@example.com)'
        },
        timeout: 30000 // 30 second timeout
      });

      const { results, meta } = response.data;

      if (results && results.length > 0) {
        allAuthors = allAuthors.concat(results);
        pageCount++;

        const avgPerPage = (allAuthors.length / pageCount).toFixed(0);
        console.log(`  ✓ Page ${pageCount}: ${results.length} authors (Total: ${allAuthors.length}, Avg: ${avgPerPage}/page)`);

        // Show progress info from meta
        if (meta) {
          console.log(`  → Total count (est.): ${meta.count || 'unknown'}`);
        }
      } else {
        console.log('  → No results on this page');
      }

      // Check if there are more pages
      if (meta && meta.next_cursor) {
        nextCursor = meta.next_cursor;
      } else {
        hasMore = false;
        console.log('\n✓ No more pages. Pagination complete!');
      }

      // Safety limit to prevent infinite loops
      if (pageCount >= 1000) {
        console.log('\n⚠ Reached safety limit of 1000 pages');
        hasMore = false;
      }

      // Small delay to be polite to the API (not required but recommended)
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (pageError) {
      console.error(`\n✗ Error fetching page ${pageCount + 1}:`, pageError.message);

      if (pageError.response) {
        console.error(`  Status: ${pageError.response.status}`);
        console.error(`  Message: ${pageError.response.statusText}`);
      }

      // If a page fails, stop pagination and return what we have
      hasMore = false;
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total authors fetched: ${allAuthors.length}`);
  console.log(`Pages fetched: ${pageCount}`);
  console.log(`Time taken: ${duration} seconds`);
  console.log(`Average: ${(allAuthors.length / Math.max(pageCount, 1)).toFixed(1)} authors/page`);

  if (allAuthors.length > 0) {
    console.log('\nSample of first author:');
    console.log(JSON.stringify(allAuthors[0], null, 2).substring(0, 500) + '...');
  }

  return {
    totalAuthors: allAuthors.length,
    pagesFetched: pageCount,
    authors: allAuthors,
    filter: filter,
    durationSeconds: parseFloat(duration)
  };
}

// Parse command line arguments
const args = process.argv.slice(2);
let filter = 'last_known_institutions.id:I97018004,has_orcid:true';
let perPage = 200;

args.forEach(arg => {
  if (arg.startsWith('--filter=')) {
    filter = arg.substring('--filter='.length);
  } else if (arg.startsWith('--per-page=')) {
    perPage = parseInt(arg.substring('--per-page='.length));
  }
});

// Run if executed directly
if (require.main === module) {
  fetchAllOpenAlexAuthors(filter, perPage)
    .then(result => {
      console.log('\n✓ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n✗ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { fetchAllOpenAlexAuthors };
