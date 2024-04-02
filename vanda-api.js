// Import node-fetch
const fetch = require('node-fetch');

// Function to search the V&A collection
async function searchVAndACollection(query) {
  const url = `https://api.vam.ac.uk/v2/objects/search?q=${encodeURIComponent(query)}&images_exist=true`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error fetching data from V&A API:', error);
  }
}

// Example search query
searchVAndACollection('jewellery');
