# OpenAlex Authors Pagination

This application includes functionality to paginate through all pages of OpenAlex author queries.

## Features

- **Automatic pagination**: Fetches all pages using OpenAlex's cursor-based pagination
- **Progress tracking**: Displays real-time progress as pages are fetched
- **Error handling**: Gracefully handles API errors and rate limits
- **Safety limits**: Prevents infinite loops with configurable page limits
- **Two usage modes**: REST API endpoint or standalone script

## Query Details

The default query fetches authors with:
- `last_known_institutions.id:I97018004` - Authors from institution I97018004
- `has_orcid:true` - Only authors with ORCID identifiers
- `per-page=200` - Maximum results per page (200 is OpenAlex's limit)

## Usage

### Option 1: REST API Endpoint

Start the server:
```bash
npm start
```

Make a GET request:
```bash
curl "http://localhost:3000/api/openalex/authors"
```

With custom filter:
```bash
curl "http://localhost:3000/api/openalex/authors?filter=last_known_institutions.id:I97018004,has_orcid:true&perPage=200"
```

**Response format:**
```json
{
  "totalAuthors": 1250,
  "pagesFetched": 7,
  "filter": "last_known_institutions.id:I97018004,has_orcid:true",
  "authors": [
    {
      "id": "https://openalex.org/A1234567890",
      "display_name": "Jane Smith",
      "orcid": "https://orcid.org/0000-0001-2345-6789",
      ...
    },
    ...
  ]
}
```

### Option 2: Standalone Script

Run directly:
```bash
node openalex_pagination.js
```

With custom parameters:
```bash
node openalex_pagination.js --filter="last_known_institutions.id:I97018004,has_orcid:true" --per-page=200
```

The script will:
1. Fetch all pages automatically
2. Display progress in real-time
3. Show a summary when complete
4. Export results that can be piped to a file

**Save results to file:**
```bash
node openalex_pagination.js > results.json 2> progress.log
```

## OpenAlex API Documentation

- **Base URL**: `https://api.openalex.org`
- **Rate Limits**: 100,000 requests per day (no key needed)
- **Polite Pool**: Add email in User-Agent for higher limits
- **Documentation**: https://docs.openalex.org

### Pagination with Cursors

OpenAlex uses cursor-based pagination:
1. First request uses `cursor=*`
2. Each response includes `meta.next_cursor`
3. Use the next_cursor value for subsequent requests
4. When `next_cursor` is null, you've reached the end

### Filter Syntax

```
filter=<entity>:<value>,<entity>:<value>
```

Examples:
- `last_known_institutions.id:I97018004`
- `has_orcid:true`
- `works_count:>10`
- `cited_by_count:>100`

Combine multiple filters with commas.

## Code Location

- **Server endpoint**: `/home/user/caddy_app/server.js:273-335`
- **Standalone script**: `/home/user/caddy_app/openalex_pagination.js`
- **Test script**: `/home/user/caddy_app/test_openalex.js`

## Troubleshooting

### 403 Forbidden Error

If you receive a 403 error, it may be due to:
1. **Network restrictions**: Your network may block access to OpenAlex API
2. **Missing User-Agent**: Ensure requests include a User-Agent header
3. **Rate limiting**: You may have exceeded the daily request limit

**Solution**: Add your email to the User-Agent header:
```javascript
headers: {
  'User-Agent': 'YourApp/1.0 (mailto:your-email@example.com)'
}
```

### No Results

If the query returns 0 results:
1. Verify the institution ID exists: `https://openalex.org/I97018004`
2. Check the filter syntax is correct
3. Test the query directly in your browser: `https://api.openalex.org/authors?filter=last_known_institutions.id:I97018004`

### Timeout Errors

For large result sets:
1. Increase the timeout in axios config
2. Consider fetching in smaller batches
3. Add delays between requests (already included: 100ms)

## Performance Tips

1. **Use per-page=200**: Maximum allowed by OpenAlex
2. **Add delays**: Script includes 100ms delay between requests
3. **Filter effectively**: More specific filters = fewer pages to fetch
4. **Monitor progress**: Script shows real-time progress
5. **Save incrementally**: For very large datasets, save results after each page

## Example Output

```
Starting OpenAlex authors pagination...
Filter: last_known_institutions.id:I97018004,has_orcid:true
Per page: 200

Fetching page 1...
  ✓ Page 1: 200 authors (Total: 200, Avg: 200/page)
  → Total count (est.): 1250
Fetching page 2...
  ✓ Page 2: 200 authors (Total: 400, Avg: 200/page)
  → Total count (est.): 1250
...
Fetching page 7...
  ✓ Page 7: 50 authors (Total: 1250, Avg: 179/page)

✓ No more pages. Pagination complete!

============================================================
SUMMARY
============================================================
Total authors fetched: 1250
Pages fetched: 7
Time taken: 8.45 seconds
Average: 178.6 authors/page

✓ Script completed successfully
```

## Integration

To use the pagination function in your own code:

```javascript
const { fetchAllOpenAlexAuthors } = require('./openalex_pagination');

async function myFunction() {
  const result = await fetchAllOpenAlexAuthors(
    'last_known_institutions.id:I97018004,has_orcid:true',
    200
  );

  console.log(`Fetched ${result.totalAuthors} authors in ${result.durationSeconds}s`);

  // Process authors
  result.authors.forEach(author => {
    console.log(author.display_name);
  });
}
```

## License

MIT
