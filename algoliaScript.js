// algoliaScript.js
document.addEventListener("DOMContentLoaded", () => {
  const { algoliasearch, instantsearch } = window;

  const searchClient = algoliasearch(
    'C1Z0K05A9J', // Application ID
    'd09c059b9a9a6b781be31934fcaef948' // API Key
  );

  const search = instantsearch({
    indexName: 'AlgoliaIndex',
    searchClient,
    future: { preserveSharedStateOnUnmount: true },
  });
  //this is the platforms avaliable for the platform filter on search.html
  const platforms = [
    "Nintendo 3DS", "Nintendo DS", "GameBoy", "GameBoy Advance", "GameBoy Color",
    "Nintendo GameCube", "Nintendo 64", "Nintendo Entertainment System (NES)", 
    "PlayStation 1", "PlayStation 2", "PlayStation 3", "PlayStation 4", "PlayStation 5",
    "PlayStation Portable", "Super Nintendo Entertainment System (SNES)", 
    "Nintendo Switch", "Nintendo Wii", "Nintendo Wii U", "Xbox", "Xbox 360", "Xbox One", "Xbox Series X"
  ];
  // the logic for the platform filter on search.html
  const platformSelect = document.getElementById('platform-filter');
  if (platformSelect) {
    platforms.forEach(platform => {
      const option = document.createElement('option');
      option.value = platform;
      option.textContent = platform;
      platformSelect.appendChild(option);
    });
  }
// the logic for the year filter on search.html
const yearSelect = document.getElementById('year-filter');
if (yearSelect) {
  for (let year = 2024; year >= 1985; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}
  // the searchbar
  search.addWidgets([
    instantsearch.widgets.searchBox({
      container: '#searchbox',
      placeholder: 'Search for games',
    }),
    // the results from the search
    instantsearch.widgets.hits({
      container: '#hits',
      templates: {
        empty: 'No results found.',
        item: (hit, { html }) => html`
          <li class="game-row ais-Hits-item">
            <div class="image">
              <img src="${hit.CoverArt}" 
                   alt="${hit.Game} cover art" />
            </div>
            <div class="details">
              <div class="game-name">
                <!-- Removed target="_blank" -->
                <a href="game.html?id=${hit.objectID}">${hit.Game || "Unknown Game"}</a>
              </div>
              <div class="game-year">Year: ${hit.Year || 'N/A'}</div>
              <div class="game-platform">Platform: ${hit.Platform || 'N/A'}</div>
              <div class="game-Publisher">Publisher: ${hit.Publisher || 'N/A'}</div>
            </div>
            <div class="buttons-and-condition">
              <div class="buttons">
                <button class="toggle-collection" data-game-id="${hit.objectID}">
                  Add/Remove from Collection
                </button>
                <button class="toggle-wishlist" data-game-id="${hit.objectID}">
                  Add/Remove from Wishlist
                </button>
              </div>
              <div class="condition-selector">
                <label for="condition-${hit.objectID}" class="visually-hidden"></label>
                <select id="condition-${hit.objectID}" class="condition-dropdown" data-game-id="${hit.objectID}">
                    <option value="" disabled selected>Select a condition</option>
                    <option value="New">New - Sealed and never used</option>
                    <option value="Complete">Complete - Includes box and manual</option>
                    <option value="No Manual">No Manual - Missing the manual</option>
                    <option value="Loose">Loose - Cartridge/disc only</option>
                </select>
              </div>
            </div>
          </li>
        `,
      },
    }),
    //only 30 games per page and the 3 filters
    instantsearch.widgets.configure({
      hitsPerPage: 30,
      facets: ['Platform', 'Year', 'coverArtAvailable'],
    }),
    // this is to switch pages if your game isn't on the first page
    instantsearch.widgets.pagination({
      container: '#pagination',
    }),
  ]);
  //the apply filters feature
  document.getElementById('apply-filters').addEventListener('click', () => {
    const platform = platformSelect.value;
    const year = yearSelect.value;
    const coverArt = document.getElementById('cover-art-filter').value;
    const filters = [];
    if (platform) filters.push(`Platform:"${platform}"`);
    if (year) filters.push(`Year=${year}`);
    if (coverArt) filters.push(`coverArtAvailable:${coverArt}`);
    search.helper.setQueryParameter('filters', filters.join(' AND ')).search();
  });
  search.start();
});
