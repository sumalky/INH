
document.addEventListener('DOMContentLoaded', () => {
    const loadInput = document.getElementById('load-input');
    const pumpSearch = document.getElementById('pump-search');
    const viewMode = document.getElementById('view-mode');
    const tableBody = document.querySelector('#data-table tbody');
    const tableContainer = document.getElementById('table-container');
    const cardContainer = document.getElementById('card-container');
    const errorMessage = document.getElementById('error-message');

    let data = [];
    let headers = [];

    // Fetch and parse CSV data
    fetch('MMA1.csv')
        .then(response => response.text())
        .then(csvText => {
            const rows = csvText.trim().split('\n');
            headers = rows[0].split(',').map(h => h.trim());
            data = rows.slice(1).map(row => {
                const values = row.split(',').map(v => v.trim());
                let rowData = {};
                headers.forEach((header, index) => {
                    rowData[header] = values[index];
                });
                return rowData;
            });
            // Initial render
            filterAndRender();
        });

    // Add event listeners
    loadInput.addEventListener('input', () => filterAndRender());
    pumpSearch.addEventListener('input', () => filterAndRender());
    viewMode.addEventListener('change', (e) => {
        if (e.target.value === 'scroll') {
            tableContainer.classList.remove('table-wrap');
            tableContainer.classList.add('table-scroll');
        } else {
            tableContainer.classList.remove('table-scroll');
            tableContainer.classList.add('table-wrap');
        }
    });

    function filterAndRender() {
        let filteredData = [...data];
        const loadValue = loadInput.value.trim();
        const searchTerm = pumpSearch.value.trim().toLowerCase();

        errorMessage.textContent = ''; // Clear previous errors

        // Filter by Pump Search
        if (searchTerm) {
            filteredData = filteredData.filter(row => {
                const pumpName = row['Feed pump'] || '';
                return pumpName.toLowerCase().includes(searchTerm);
            });
        }

        // Determine the correct %Stroke value based on Load
        if (loadValue) {
            const loadNumber = parseFloat(loadValue);
            if (isNaN(loadNumber)) {
                errorMessage.textContent = 'Please enter a valid number for % Load.';
                renderTable([]);
                renderCards([]);
                return;
            }

            const strokeHeader = findStrokeHeader(loadNumber);
            if (!strokeHeader) {
                errorMessage.textContent = 'Load value is out of range.';
                renderTable([]);
                renderCards([]);
                return;
            }

            // Create a new array with the calculated stroke value
            filteredData = filteredData.map(row => {
                return {
                    ...row,
                    '%Stroke': row[strokeHeader] || 'N/A'
                };
            });

        } else {
             // If no load value, show a default or empty state for stroke
            filteredData = filteredData.map(row => ({
                ...row,
                '%Stroke': '-' // Default display
            }));
        }

        renderTable(filteredData);
        renderCards(filteredData);
    }

    function findStrokeHeader(load) {
        // Find the correct header like "1-60%", "61-65%"
        for (const header of headers) {
            if (header.includes('%')) {
                const parts = header.replace('%', '').split('-');
                if (parts.length === 2) {
                    const [min, max] = parts.map(parseFloat);
                    if (load >= min && load <= max) {
                        return header;
                    }
                }
            }
        }
        return null; // Out of range
    }

    function renderTable(dataToRender) {
        tableBody.innerHTML = '';
        if (dataToRender.length === 0 && !errorMessage.textContent) {
             errorMessage.textContent = 'No matching data found.';
        }

        dataToRender.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row['Feed pump']}</td>
                <td>${row['Destination']}</td>
                <td>${row['Inhibitor']}</td>
                <td>${row['Drum']}</td>
                <td>${row['%Stroke'] || '-'}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function renderCards(dataToRender) {
        cardContainer.innerHTML = '';
        if (dataToRender.length === 0) {
            return; // No need to show error message twice
        }

        // Group data by 'Feed pump'
        const groupedData = dataToRender.reduce((acc, row) => {
            const key = row['Feed pump'];
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(row);
            return acc;
        }, {});

        // Create a card for each group
        for (const pumpName in groupedData) {
            const card = document.createElement('div');
            card.className = 'card';

            const title = document.createElement('h2');
            title.className = 'card-title';
            title.textContent = pumpName;
            card.appendChild(title);

            const list = document.createElement('ul');
            list.className = 'card-list';
            groupedData[pumpName].forEach(row => {
                const listItem = document.createElement('li');
                const strokeValue = (row['%Stroke'] === '-') ? '-' : `${row['%Stroke']}%`;
                listItem.innerHTML = `
                    <span>${row['Drum']} (${row['Inhibitor']})</span>
                    <span>${row['Destination']} = ${strokeValue}</span>
                `;
                list.appendChild(listItem);
            });
            card.appendChild(list);
            cardContainer.appendChild(card);
        }
    }
});
