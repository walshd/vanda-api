let currentSearchTerm = '';

// Function to search the V&A collection
function searchVAndACollection(query, page = 1) {
    currentSearchTerm = query; // Update the global variable whenever a new search is performed
    const pageSize = 15;
    const url = `https://api.vam.ac.uk/v2/objects/search?q=${encodeURIComponent(query)}&page=${page}&images_exist=true`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            displayResults(data);
            setupPagination(data.info.record_count, page, pageSize);
        })
        .catch(error => {
            console.error('Error fetching data from V&A API:', error);
        });
}

// Function to display search results
function displayResults(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Clear previous results

    if (data.records && data.records.length > 0) {
        const list = document.createElement('ul');
        data.records.forEach(item => {
            const listItem = document.createElement('li');
            listItem.style.listStyleType = 'none'; // No bullets

            // Handling missing titles, makers, or thumbnails
            const title = item._primaryTitle || 'Title not available';
            const makerName = item._primaryMaker && item._primaryMaker.name ? item._primaryMaker.name : 'Maker unknown';
            const thumbnail = item._images && item._images._primary_thumbnail ? item._images._primary_thumbnail : 'https://via.placeholder.com/100'; // Placeholder image for missing thumbnails

            listItem.innerHTML = `
                <img src="${thumbnail}" alt="Thumbnail" style="width:100px; height:auto; margin-right: 10px;">
                <span><strong>${title}</strong> by ${makerName}</span>
            `;
            list.appendChild(listItem);
        });
        resultsContainer.appendChild(list);
    } else {
        resultsContainer.innerHTML = '<p>No results found.</p>';
    }
}

// Function to setup pagination controls
function setupPagination(totalRecords, currentPage, pageSize) {
    const totalPages = Math.ceil(totalRecords / pageSize);
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; // Clear previous pagination controls

    // Previous Page Button
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.onclick = () => searchVAndACollection(currentSearchTerm, currentPage - 1);
        paginationContainer.appendChild(prevBtn);
    }

    // Next Page Button
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.onclick = () => searchVAndACollection(currentSearchTerm, currentPage + 1);
        paginationContainer.appendChild(nextBtn);
    }

    // Current Page Indicator (optional, could also do more sophisticated pagination)
    const pageIndicator = document.createElement('span');
    pageIndicator.textContent = ` Page ${currentPage} of ${totalPages} `;
    paginationContainer.appendChild(pageIndicator);
}


// Handle form submission
document.getElementById('searchForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent the default form submission
    const query = document.getElementById('searchQuery').value;
    searchVAndACollection(query);
});