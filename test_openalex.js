// Simple test script for OpenAlex pagination endpoint
const axios = require('axios');

async function testOpenAlexPagination() {
  console.log('Testing OpenAlex pagination...\n');

  try {
    const response = await axios.get('http://localhost:3000/api/openalex/authors', {
      timeout: 60000 // 60 second timeout for pagination
    });

    console.log('✓ Request successful!');
    console.log(`Total authors fetched: ${response.data.totalAuthors}`);
    console.log(`Pages fetched: ${response.data.pagesFetched}`);
    console.log(`Filter used: ${response.data.filter}`);

    if (response.data.authors && response.data.authors.length > 0) {
      console.log('\nFirst author:');
      const firstAuthor = response.data.authors[0];
      console.log(`  - ID: ${firstAuthor.id}`);
      console.log(`  - Name: ${firstAuthor.display_name}`);
      console.log(`  - ORCID: ${firstAuthor.orcid || 'N/A'}`);
    }

  } catch (error) {
    console.error('✗ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testOpenAlexPagination();
