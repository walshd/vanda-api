document.addEventListener('DOMContentLoaded', function() {
    const timelineContainer = document.getElementById('results');
    let currentSearchTerm = '';



    // Function to update the width of the dummy scroll content based on the timeline's content
    function updateDummyScrollWidth() {
        const dummyScrollContent = document.getElementById('dummyScrollContent');
        dummyScrollContent.style.width = `${timelineContainer.scrollWidth}px`;
    }

    // Synchronize the scroll position of the timeline with the dummy scrollbar
    function syncScroll() {
        dummyScrollContainer.addEventListener('scroll', function() {
            timelineContainer.scrollLeft = this.scrollLeft;
        });

        timelineContainer.addEventListener('scroll', function() {
            dummyScrollContainer.scrollLeft = this.scrollLeft;
        });
    }

    async function fetchAllItems(queryParam) {
        let currentPage = 1;
        let hasMoreItems = true;
        let allItems = [];
        // const resultsPerPage = parseInt(document.getElementById('maxItemsSelect').value, 10); //if have dropdown on page or use max 100 below for less api calls.
        const resultsPerPage = 100; // Adjust based on API limits

        while (hasMoreItems && allItems.length <= 2000) { // Limit to 2000 items
            // Constructing the query based on the type of queryParam provided
            let queryURLPart;
            if (queryParam.type === 'search') {
                // For search queries, use 'q'
                queryURLPart = `q=${encodeURIComponent(queryParam.value)}`;
            } else if (queryParam.type === 'category') {
                // For category filters, use 'id_category'
                queryURLPart = `id_category=${queryParam.value}`;
            } else {
                queryURLPart = ''; // Default case, no query
            }

            const url = `https://api.vam.ac.uk/v2/objects/search?${queryURLPart}&page=${currentPage}&page_size=${resultsPerPage}&images_exist=1`;
            
            // Log the URL to the console
            console.log("Requesting URL:", url);
            
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                console.log(data)
                allItems = allItems.concat(data.records);
                currentPage++;
                hasMoreItems = data.info && currentPage <= data.info.pages && allItems.length < 2000;
            } catch (error) {
                console.error("Fetching data error:", error);
                hasMoreItems = false; // Stop on error
            }
        }

        processAndDisplayItems(allItems);
    }

    // Modified fetchAllItems function
    async function fetchInitialItems() {
        let currentPage = 1;
        let allItems = [];
        const maxItems = 1000; // Target number of items
        const resultsPerPage = 100; // Max allowed by API

        while (allItems.length < maxItems) {
            const url = `https://api.vam.ac.uk/v2/objects/search?images_exist=1&page=${currentPage}&page_size=${resultsPerPage}`;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                allItems = allItems.concat(data.records);
                if (data.records.length < resultsPerPage) break; // Break if last page
                currentPage++;
            } catch (error) {
                console.error("Fetching data error:", error);
                break; // Exit loop on error
            }
        }

        processAndDisplayItems(allItems.slice(0, maxItems));
    }


    function normalizeDate(dateStr) {
        const yearMatch = dateStr.match(/^\d{4}$/);
        if (yearMatch) return dateStr;
        const decadeMatch = dateStr.match(/^(\d{4})s$/);
        if (decadeMatch) return decadeMatch[1];
        const rangeMatch = dateStr.match(/^(\d{4})-(\d{4})$/);
        if (rangeMatch) return rangeMatch[1];
        return 'Unknown';
    }

    function processAndDisplayItems(items) {
        timelineContainer.innerHTML = ''; // Clear existing content

        // Normalize and sort items by year
        const sortedItems = items.map(item => ({
            ...item,
            normalizedYear: normalizeDate(item._primaryDate || 'Unknown')
        })).sort((a, b) => a.normalizedYear.localeCompare(b.normalizedYear));

        // Group items by year and display
        const itemsByYear = sortedItems.reduce((acc, item) => {
            acc[item.normalizedYear] = acc[item.normalizedYear] || [];
            acc[item.normalizedYear].push(item);
            return acc;
        }, {});

        Object.entries(itemsByYear).forEach(([year, items]) => {
            const yearElement = document.createElement('div');
            yearElement.className = 'year-marker';
            yearElement.innerHTML = `<div class="year-label">${year}</div>`;
            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'items-container';

            items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'item';
                itemElement.innerHTML = `
                    <img src="${item._images._primary_thumbnail || 'https://via.placeholder.com/100'}" alt="${item._primaryTitle || item._images._primary_thumbnail}">
                    <p>${item._primaryTitle || 'N/A'}</p>
                `;
                // Add click event listener for opening the modal
                itemElement.addEventListener('click', function() {
                    openModal(item);
                });
                itemsContainer.appendChild(itemElement);

                
            });

            yearElement.appendChild(itemsContainer);
            timelineContainer.appendChild(yearElement);

        });
        // Call after items are added to ensure the dummy scrollbar reflects the new content size
        updateDummyScrollWidth();
    }

    
    fetchInitialItems(); // Call fetchInitialItems on page load without a search query
    fetchInitialItems(); // Existing call for initial items
    fetchAndDisplayCategories(); // New call to fetch and display categories
    

    // Trigger fetch and display
    // document.getElementById('searchForm').addEventListener('submit', function(e) {
    //     e.preventDefault();
    //     currentSearchTerm = document.getElementById('searchQuery').value;
    //     fetchAllItems(currentSearchTerm);
    // });
    document.getElementById('searchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const searchQuery = document.getElementById('searchQuery').value;
        fetchAllItems({type: 'search', value: searchQuery}); // Ensure this matches the expected parameter structure
    });
    
    function createModal() {
        // Create the modal container
        const modal = document.createElement('div');
        modal.id = 'itemModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    
        // Create the modal content container
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modal.appendChild(modalContent);
    
        // Create the close button
        const closeButton = document.createElement('span');
        closeButton.className = 'close-button';
        closeButton.innerHTML = '&times;';
        closeButton.onclick = () => modal.style.display = 'none';
        modalContent.appendChild(closeButton);
    
        // Create the image container
        const modalImage = document.createElement('img');
        modalImage.id = 'modalImage';
        modalContent.appendChild(modalImage);
    
        // Create the info container
        const modalInfo = document.createElement('div');
        modalInfo.id = 'modalInfo';
        modalContent.appendChild(modalInfo);
    
        // Close modal when clicking outside of it
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        };
        
        return { modal, modalImage, modalInfo };
    }
    
    function openModal(item) {
        // Check if the modal already exists, if not, create it
        let modal = document.getElementById('itemModal');
        let modalImage = document.getElementById('modalImage');
        let modalInfo = document.getElementById('modalInfo');
        if (!modal) {
            const modalElements = createModal();
            modal = modalElements.modal;
            modalImage = modalElements.modalImage;
            modalInfo = modalElements.modalInfo;
        }
    
        // Set the larger image URL
        const imageUrl = item._images._iiif_image_base_url + 'full/500,/0/default.jpg'; // Adjust size parameters as needed
        modalImage.src = imageUrl; 
        modalInfo.innerHTML = `
            <h2>${item._primaryTitle || 'No Title'}</h2>
            <p>Object Type: ${item.objectType}</p>
            <p>Accession Number: ${item.accessionNumber}</p>
            <p>System Number: ${item.systemNumber}</p>
            <p>Made by: ${item._primaryMaker.name || 'Unknown'}</p>
            <p>Date: ${item._primaryDate}</p>
            <p>Place: ${item._primaryPlace}</p>
            <p>Currently: ${item._currentLocation.displayName}</p>
        `; // Dynamically populate the modal with item details
    
        modal.style.display = "block";
    }
    
    async function fetchAndDisplayCategories() {
        const url = 'https://api.vam.ac.uk/v2/objects/clusters/search?images_exist=true&cluster_size=10';
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            displayCategoryTiles(data.clusters.category.terms); // Display categories as tiles
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    }
    
    function displayCategoryTiles(categories) {
        const container = document.getElementById('categoriesContainer');
        container.innerHTML = ''; // Clear existing tiles before displaying new ones
    
        categories.forEach(category => {
            const tile = document.createElement('div');
            tile.className = 'category-tile';
            tile.textContent = `${category.value} (${category.count})`;
            
            // Add click event listener for this tile
            tile.addEventListener('click', () => {
                fetchAllItems({type: 'category', value: category.id}); // This should match the expected structure
            });
    
            container.appendChild(tile);
        });
    }
    
    
    


    // Initial call to set up the dummy scrollbar width and sync function
    updateDummyScrollWidth();
    syncScroll();

});

// document.addEventListener('DOMContentLoaded', function() {
//     let currentPage = 1;
//     let currentSearchTerm = '';

//     // Handles the actual search and display logic
//     async function searchAndDisplay(query, page = 1) {
//         currentSearchTerm = query; // Store the current search term globally
//         currentPage = page; // Update the current page

//         const resultsPerPage = parseInt(document.getElementById('maxItemsSelect').value, 10);
//         const url = `https://api.vam.ac.uk/v2/objects/search?q=${encodeURIComponent(query)}&page=${page}&page_size=${resultsPerPage}&images_exist=1`;

//         try {
//             const response = await fetch(url);
//             if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//             const data = await response.json();
//             displayResultsOnTimeline(data.records);
//             setupPagination(data.info.pages);
//         } catch (error) {
//             console.error("Error fetching data:", error);
//         }
//     }

//     // Setup pagination
//     function setupPagination(totalPages) {
//         const paginationContainer = document.getElementById('pagination');
//         paginationContainer.innerHTML = '';

//         if (currentPage > 1) {
//             const prevButton = document.createElement('button');
//             prevButton.textContent = 'Previous';
//             prevButton.onclick = () => searchAndDisplay(currentSearchTerm, currentPage - 1);
//             paginationContainer.appendChild(prevButton);
//         }

//         if (currentPage < totalPages) {
//             const nextButton = document.createElement('button');
//             nextButton.textContent = 'Next';
//             nextButton.onclick = () => searchAndDisplay(currentSearchTerm, currentPage + 1);
//             paginationContainer.appendChild(nextButton);
//         }
//     }

//     // New function to process and display items on a timeline
//     function displayResultsOnTimeline(items) {
//         const timelineContainer = document.getElementById('results'); // Changed to use the existing 'results' div for the timeline
//         timelineContainer.innerHTML = ''; // Clear existing content

//         // Group items by date
//         const itemsByDate = items.reduce((acc, item) => {
//             const date = item._primaryDate || 'Unknown Date';
//             if (!acc[date]) acc[date] = [];
//             acc[date].push(item);
//             return acc;
//         }, {});

//         // Sort dates and display each group
//         Object.keys(itemsByDate).sort().forEach(date => {
//             const dateSection = document.createElement('section');
//             dateSection.innerHTML = `<h2>${date}</h2>`;
//             itemsByDate[date].forEach(item => {
//                 const itemElement = document.createElement('div');
//                 itemElement.innerHTML = `
//                     <img src="${item._images?._primary_thumbnail || 'https://via.placeholder.com/100'}" alt="${item._primaryTitle}">
//                     <p>${item._primaryTitle || 'N/A'}</p>
//                 `;
//                 dateSection.appendChild(itemElement);
//             });
//             timelineContainer.appendChild(dateSection);
//         });
//     }

//     // Handle form submission
//     document.getElementById('searchForm').addEventListener('submit', function(e) {
//         e.preventDefault();
//         const query = document.getElementById('searchQuery').value;
//         searchAndDisplay(query, 1);
//     });

//     // Handle changes in the 'maxItemsSelect' dropdown
//     document.getElementById('maxItemsSelect').addEventListener('change', function() {
//         if (currentSearchTerm) {
//             searchAndDisplay(currentSearchTerm, 1); // Trigger search with updated results per page
//         }
//     });
// });


// below works well...

// document.addEventListener('DOMContentLoaded', function() {
//     const timelineContainer = document.getElementById('results');
//     const dummyScrollContainer = document.getElementById('dummyScrollContainer');
//     let currentPage = 1;
//     let isLoading = false;
//     let hasMoreItems = true;
//     let currentSearchTerm = '';

//     // Function to update the width of the dummy scroll content based on the timeline's content
//     function updateDummyScrollWidth() {
//         const dummyScrollContent = document.getElementById('dummyScrollContent');
//         dummyScrollContent.style.width = `${timelineContainer.scrollWidth}px`;
//     }

//     // Synchronize the scroll position of the timeline with the dummy scrollbar
//     function syncScroll() {
//         dummyScrollContainer.addEventListener('scroll', function() {
//             timelineContainer.scrollLeft = this.scrollLeft;
//         });

//         timelineContainer.addEventListener('scroll', function() {
//             dummyScrollContainer.scrollLeft = this.scrollLeft;
//         });
//     }

//     // async function fetchItems(query, page) {
//     //     const resultsPerPage = parseInt(document.getElementById('maxItemsSelect').value, 10);
//     //     const url = `https://api.vam.ac.uk/v2/objects/search?q=${encodeURIComponent(query)}&page=${page}&page_size=${resultsPerPage}&images_exist=1`;

//     //     try {
//     //         const response = await fetch(url);
//     //         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//     //         const data = await response.json();
//     //         console.log(data)
//     //         hasMoreItems = currentPage < data.info.pages;
//     //         displayResultsOnTimeline(data.records, currentPage > 1);
//     //         updateDummyScrollWidth();
//     //     } catch (error) {
//     //         console.error("Fetching data error:", error);
//     //     }
//     // }
//     async function fetchItems(query, startPage = 1, maxItems = 2000) {
//         let currentPage = startPage;
//         let fetchedItems = [];
//         const resultsPerPage = parseInt(document.getElementById('maxItemsSelect').value, 10);
//         let hasMore = true;
    
//         while (hasMore && fetchedItems.length < maxItems) {
//             const url = `https://api.vam.ac.uk/v2/objects/search?q=${encodeURIComponent(query)}&page=${currentPage}&page_size=${resultsPerPage}&images_exist=1`;
    
//             try {
//                 const response = await fetch(url);
//                 if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//                 const data = await response.json();
//                 fetchedItems = fetchedItems.concat(data.records);
//                 currentPage++;
//                 hasMore = currentPage <= data.info.pages && fetchedItems.length < maxItems;
//             } catch (error) {
//                 console.error("Fetching data error:", error);
//                 hasMore = false; // Stop fetching more data on error
//             }
//         }
    
//         // Once all data is fetched, display the results and update the dummy scroll width
//         displayResultsOnTimeline(fetchedItems.slice(0, maxItems), false);
//         updateDummyScrollWidth();
//     }

//     function normalizeDate(dateStr) {
//         const yearMatch = dateStr.match(/^\d{4}$/);
//         if (yearMatch) return dateStr;
//         const decadeMatch = dateStr.match(/^(\d{4})s$/);
//         if (decadeMatch) return decadeMatch[1];
//         const rangeMatch = dateStr.match(/^(\d{4})-(\d{4})$/);
//         if (rangeMatch) return rangeMatch[1];
//         return 'Unknown';
//     }

//     async function searchAndDisplay(query, append = false) {
//         if (isLoading || !hasMoreItems) return;
//         isLoading = true;
//         await fetchItems(query, currentPage);
//         isLoading = false;
//         if (!append) currentPage = 1; else currentPage++;
//     }

//     function displayResultsOnTimeline(items, append) {
//         if (!append) {
//             timelineContainer.innerHTML = ''; // Clear existing content if not appending
//         }
    
//         // Ensure dates are processed and displayed
//         items.forEach(item => {
//             const normalizedYear = normalizeDate(item._primaryDate);
//             let yearElement = document.querySelector(`.year-marker[data-year="${normalizedYear}"]`);
//             if (!yearElement) {
//                 yearElement = document.createElement('div');
//                 yearElement.className = 'year-marker';
//                 yearElement.setAttribute('data-year', normalizedYear);
//                 yearElement.innerHTML = `<div class="year-label">${normalizedYear}</div><div class="items-container"></div>`;
//                 timelineContainer.appendChild(yearElement);
//             }

//             const itemElement = document.createElement('div');
//             itemElement.className = 'item';
//             itemElement.innerHTML = `
//                 <img src="${item._images._primary_thumbnail || 'https://via.placeholder.com/100'}" alt="${item._primaryTitle}">
//                 <p>${item._primaryTitle || 'N/A'}</p>
//             `;
//             yearElement.querySelector('.items-container').appendChild(itemElement);
//         });
    
//         // Call after items are added to ensure the dummy scrollbar reflects the new content size
//         updateDummyScrollWidth();
//     }
    

//     // Event listeners for form submission and other interactions
//     document.getElementById('searchForm').addEventListener('submit', function(e) {
//         e.preventDefault();
//         currentSearchTerm = document.getElementById('searchQuery').value;
//         searchAndDisplay(currentSearchTerm, false);
//     });

//     document.getElementById('maxItemsSelect').addEventListener('change', function() {
//         if (currentSearchTerm) {
//             searchAndDisplay(currentSearchTerm, false);
//         }
//     });

//     // Initial call to set up the dummy scrollbar width and sync function
//     updateDummyScrollWidth();
//     syncScroll();
// });
