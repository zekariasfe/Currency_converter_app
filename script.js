const API_KEY = '9c0d228adadd4324ac2794c8';
const BASE_API_URL = 'https://v6.exchangerate-api.com/v6/' + API_KEY;

// DOM Elements
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const amount = document.getElementById('amount');
const conversionResult = document.getElementById('conversionResult');
const convertButton = document.getElementById('convert');
const addToFavoritesBtn = document.getElementById('addToFavorites');
const darkModeToggle = document.getElementById('darkModeToggle');
const rootElement = document.documentElement;
const multiCurrencyRates = document.getElementById('multiCurrencyRates');
const favoritesSection = document.querySelector('.favorites');

// Load favorites from localStorage or initialize an empty set
const favoritePairs = new Set(JSON.parse(localStorage.getItem('favoritePairs')) || []);

// Pagination Variables
let currentPage = 1;
const ratesPerPage = 10; // Number of rates to display per page

// Populate the dropdown menus with currency options
async function populateCurrencyDropdowns() {
  try {
    const response = await fetch(`${BASE_API_URL}/latest/USD`);
    const data = await response.json();

    if (data.result === 'success') {
      const currencies = Object.keys(data.conversion_rates);

      currencies.forEach((currency) => {
        const optionFrom = document.createElement('option');
        const optionTo = document.createElement('option');

        optionFrom.value = currency;
        optionFrom.textContent = currency;

        optionTo.value = currency;
        optionTo.textContent = currency;

        fromCurrency.appendChild(optionFrom);
        toCurrency.appendChild(optionTo);
      });

      // Set default values
      fromCurrency.value = 'USD';
      toCurrency.value = 'EUR';
    }
  } catch (error) {
    console.error('An error occurred while fetching currency options.', error);
  }
}

// Fetch exchange rate and calculate conversion
async function convertCurrency() {
  const from = fromCurrency.value;
  const to = toCurrency.value;
  const amt = parseFloat(amount.value);

  // Validate the input
  if (!amt || amt <= 0 || isNaN(amt)) {
    conversionResult.value = 'Invalid amount. Please enter a valid number.';
    return;
  }

  try {
    const response = await fetch(`${BASE_API_URL}/latest/${from}`);
    const data = await response.json();

    if (data.result === 'success') {
      const rate = data.conversion_rates[to];
      if (rate) {
        const result = (amt * rate).toFixed(2);
        conversionResult.value = `${amt} ${from} = ${result} ${to}`;
      }

      // Update the multi-currency section dynamically
      displayMultiCurrencyRates(from);
    }
  } catch (error) {
    console.error('An error occurred while fetching the exchange rate.', error);
  }
}

// Add to Favorites functionality
addToFavoritesBtn.addEventListener('click', () => {
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (from && to) {
    const favoritePair = `${from} to ${to}`;

    if (!favoritePairs.has(favoritePair)) {
      favoritePairs.add(favoritePair);
      updateFavoritesSection();
      saveFavoritesToLocalStorage(); // Save to localStorage
    }
  }
});

// Save favorites to localStorage
function saveFavoritesToLocalStorage() {
  localStorage.setItem('favoritePairs', JSON.stringify([...favoritePairs]));
}

// Update Favorites Section
function updateFavoritesSection() {
  favoritesSection.innerHTML = '<h3>Favorites</h3>'; // Clear existing favorites and re-add header

  favoritePairs.forEach((pair) => {
    const listItem = document.createElement('div');
    listItem.classList.add('favorite-item');
    listItem.textContent = pair;

    // Optional: Add a remove button for each favorite
    const removeButton = document.createElement('button');
    removeButton.textContent = '❌';
    removeButton.classList.add('remove-favorite');
    removeButton.addEventListener('click', () => {
      favoritePairs.delete(pair);
      updateFavoritesSection();
      saveFavoritesToLocalStorage(); // Update localStorage
    });

    listItem.appendChild(removeButton);
    favoritesSection.appendChild(listItem);
  });
}

// Display rates with pagination
async function displayMultiCurrencyRates(baseCurrency = 'USD') {
  try {
    const response = await fetch(`${BASE_API_URL}/latest/${baseCurrency}`);
    const data = await response.json();

    if (data.result === 'success') {
      const rates = Object.entries(data.conversion_rates);

      // Update pagination controls
      updatePagination(rates, currentPage);

      // Display rates for the current page
      displayRatesOnPage(rates, currentPage);
    }
  } catch (error) {
    console.error('An error occurred while fetching currency rates.', error);
  }
}

// Display rates for the current page
function displayRatesOnPage(rates, page) {
  const start = (page - 1) * ratesPerPage;
  const end = start + ratesPerPage;
  const ratesToShow = rates.slice(start, end);

  // Clear the multi-currency section
  multiCurrencyRates.innerHTML = '';

  // Create a table to display rates
  const table = document.createElement('table');
  table.classList.add('currency-table');

  // Add table header
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th>Currency</th>
    <th>Rate (1 ${fromCurrency.value})</th>
  `;
  table.appendChild(headerRow);

  // Add each currency rate as a row
  ratesToShow.forEach(([currency, rate]) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${currency}</td>
      <td>${rate.toFixed(4)}</td>
    `;
    table.appendChild(row);
  });

  // Append the table to the multi-currency section
  multiCurrencyRates.appendChild(table);
}

// Update Pagination Controls
function updatePagination(rates, currentPage) {
  const totalPages = Math.ceil(rates.length / ratesPerPage);

  const paginationControls = document.createElement('div');
  paginationControls.classList.add('pagination-controls');

  // Add Previous Button
  if (currentPage > 1) {
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.addEventListener('click', () => {
      currentPage--;
      displayRatesOnPage(rates, currentPage);
      updatePagination(rates, currentPage);
    });
    paginationControls.appendChild(prevButton);
  }

  // Add Next Button
  if (currentPage < totalPages) {
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.addEventListener('click', () => {
      currentPage++;
      displayRatesOnPage(rates, currentPage);
      updatePagination(rates, currentPage);
    });
    paginationControls.appendChild(nextButton);
  }

  // Clear old controls and add new ones
  const existingControls = document.querySelector('.pagination-controls');
  if (existingControls) {
    existingControls.remove();
  }
  multiCurrencyRates.parentElement.appendChild(paginationControls);
}

// Dark Mode Toggle
darkModeToggle.addEventListener('click', () => {
  const currentTheme = rootElement.getAttribute('data-theme');
  rootElement.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
});

// Attach convert button event listener
convertButton.addEventListener('click', convertCurrency);

// Initialize App
populateCurrencyDropdowns();
updateFavoritesSection();
displayMultiCurrencyRates();
