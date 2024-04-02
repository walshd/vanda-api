// document.addEventListener('DOMContentLoaded', function() {
//     let currentPage = 1;
//     let totalItems = 0;
//     const maxItems = 200; // Updated to allow for up to 200 items as per the HTML dropdown

//     // Fetches items from the API, up to a maximum limit
//     async function fetchItems(query, page = 1) {
//         const resultsPerPage = parseInt(document.getElementById('maxItemsSelect').value, 10);
//         const url = `https://api.vam.ac.uk/v2/objects/search?q=${encodeURIComponent(query)}&page=${page}&page_size=${resultsPerPage}&images_exist=1`;
//         const response = await fetch(url);
//         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//         return response.json();
//     }

//     // Displays a portion of the items based on pagination
//     function displayResults(items) {
//         const resultsContainer = document.getElementById('results');
//         resultsContainer.innerHTML = '';
//         items.forEach(item => {
//             const listItem = document.createElement('li');
//             listItem.innerHTML = `
//                 <img src="${item._images?._primary_thumbnail || 'https://via.placeholder.com/100'}" alt="Thumbnail" style="width:100px; height:auto;">
//                 <div>
//                     <strong>Title:</strong> ${item._primaryTitle || 'N/A'}<br>
//                     <strong>Maker:</strong> ${item._primaryMaker?.name || 'N/A'}<br>
//                     <strong>Date:</strong> ${item._primaryDate || 'N/A'}<br>
//                     <strong>Type:</strong> ${item.objectType || 'N/A'}
//                 </div>
//             `;
//             resultsContainer.appendChild(listItem);
//         });
//     }

//     // Function to initiate a fetch and display based on the current search term and page
//     async function fetchAndDisplay(query) {
//         const data = await fetchItems(query, currentPage);
//         totalItems = Math.min(data.info.record_count, maxItems);
//         displayResults(data.records);
//     }

//     // Handle form submission
//     document.getElementById('searchForm').addEventListener('submit', function(e) {
//         e.preventDefault();
//         const query = document.getElementById('searchQuery').value;
//         currentPage = 1; // Reset to first page for new search
//         fetchAndDisplay(query);
//     });

//     // Handle changes in the 'maxItemsSelect' dropdown
//     document.getElementById('maxItemsSelect').addEventListener('change', function() {
//         if (currentSearchTerm) {
//             currentPage = 1; // Reset to the first page upon changing the number of items to display
//             fetchAndDisplay(currentSearchTerm); // Refetch and display when items per page change
//         }
//     });

//     let currentSearchTerm = ''; // Initialize current search term variable
// });

document.addEventListener('DOMContentLoaded', function() {
    let currentPage = 1;
    let currentSearchTerm = '';

    // Handles the actual search and display logic
    async function searchAndDisplay(query, page = 1) {
        currentSearchTerm = query; // Store the current search term globally
        currentPage = page; // Update the current page

        const resultsPerPage = parseInt(document.getElementById('maxItemsSelect').value, 10);
        const url = `https://api.vam.ac.uk/v2/objects/search?q=${encodeURIComponent(query)}&page=${page}&page_size=${resultsPerPage}&images_exist=1`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            displayResults(data.records);
            setupPagination(data.info.pages);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    // Setup pagination
    function setupPagination(totalPages) {
        const paginationContainer = document.getElementById('pagination');
        paginationContainer.innerHTML = '';

        if (currentPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.textContent = 'Previous';
            prevButton.onclick = () => searchAndDisplay(currentSearchTerm, currentPage - 1);
            paginationContainer.appendChild(prevButton);
        }

        if (currentPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next';
            nextButton.onclick = () => searchAndDisplay(currentSearchTerm, currentPage + 1);
            paginationContainer.appendChild(nextButton);
        }
    }

    // Display search results
    function displayResults(items) {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = items.map(item => `
            <li>
            <article>
                <img src="${item._images?._primary_thumbnail || 'https://via.placeholder.com/100'}" alt="${item._primaryTitle}">
                <div>
                    <!-- <strong>Title:</strong> --> <h1>${item._primaryTitle || 'N/A'}</h1><br>
                    <strong>Maker:</strong> ${item._primaryMaker?.name || 'N/A'}<br>
                    <strong>Date:</strong> ${item._primaryDate || 'N/A'}<br>
                    <strong>Type:</strong> ${item.objectType || 'N/A'}
                </div>
            </article>
            </li>
        `).join('');
    }

    // Handle form submission
    document.getElementById('searchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const query = document.getElementById('searchQuery').value;
        searchAndDisplay(query, 1);
    });

    // Handle changes in the 'maxItemsSelect' dropdown
    document.getElementById('maxItemsSelect').addEventListener('change', function() {
        if (currentSearchTerm) {
            searchAndDisplay(currentSearchTerm, 1); // Trigger search with updated results per page
        }
    });
});
