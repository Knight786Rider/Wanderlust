// public/js/filter.js
document.addEventListener('DOMContentLoaded', () => {
  const listingsGrid = document.getElementById('listingsGrid');
  const categoryContainer = document.getElementById('categoryContainer');
  const filtersForm = document.getElementById('filtersForm');
  const taxSwitch = document.getElementById('taxSwitch');
  const TAX_RATE = 0.10; // 10% example

  // Utility: build query string from params object
  function buildQuery(params) {
    const esc = encodeURIComponent;
    return Object.keys(params)
      .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
      .map(k => esc(k) + '=' + esc(params[k]))
      .join('&');
  }

  // Render card markup for listings array
  function renderListings(listings, showBaseOnly) {
    listingsGrid.innerHTML = '';
    if (!listings || listings.length === 0) {
      listingsGrid.innerHTML = `<div class="col-12"><div class="alert alert-warning">No listings match the filters.</div></div>`;
      return;
    }

    const frag = document.createDocumentFragment();

    listings.forEach(listing => {
      // Build image source safe: prefer listing.image.url, fall back to listing.imageUrl (API) or placeholder
      const imageSrc = (listing.image && listing.image.url) || listing.imageUrl || 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60';

      const colDiv = document.createElement('div');
      colDiv.className = 'col';

      const a = document.createElement('a');
      a.href = `/listings/${listing._id}`;
      a.className = 'listing-link text-decoration-none text-dark';

      const card = document.createElement('div');
      card.className = 'card border-0 shadow-sm rounded-4 overflow-hidden h-100';

      const img = document.createElement('img');
      img.src = imageSrc;
      img.className = 'card-img-top';
      img.style.height = '210px'; // match the EJS rendered height
      img.style.objectFit = 'cover';

      const body = document.createElement('div');
      body.className = 'card-body';

      const h5 = document.createElement('h5');
      h5.className = 'fw-semibold';
      h5.textContent = listing.title;

      const loc = document.createElement('p');
      loc.className = 'text-muted mb-1';
      loc.textContent = `${listing.location || ''}${listing.country ? ', ' + listing.country : ''}`;

      const priceP = document.createElement('p');
      priceP.className = 'fw-semibold mb-0 price-display';
      priceP.dataset.basePrice = listing.price || 0;
      const base = Number(listing.price || 0);
      if (showBaseOnly) {
        priceP.textContent = '₹' + base.toLocaleString('en-IN') + ' night';
      } else {
        const total = Math.round(base * (1 + TAX_RATE));
        priceP.textContent = '₹' + total.toLocaleString('en-IN') + ' total incl tax';
      }

      const guestP = document.createElement('p');
      guestP.className = 'small text-muted mb-0';
      guestP.textContent = 'Guests: ' + (listing.guests || 1);

      body.appendChild(h5);
      body.appendChild(loc);
      body.appendChild(priceP);
      body.appendChild(guestP);

      card.appendChild(img);
      card.appendChild(body);
      a.appendChild(card);
      colDiv.appendChild(a);

      frag.appendChild(colDiv);
    });

    listingsGrid.appendChild(frag);
  }

  // Fetch listings with given params (object). Returns JSON listings
  async function fetchListings(params = {}) {
    // we will add ajax=1 so server returns JSON
    params.ajax = '1';
    const qs = buildQuery(params);
    const url = '/listings?' + qs;
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json'
        }
      });
      const data = await res.json();
      if (!data.ok) {
        console.warn('Filter error:', data.msg || 'unknown');
        renderListings([], taxSwitch.checked);
        return;
      }
      // render
      renderListings(data.listings || [], taxSwitch.checked);
      // update active category button highlight (if category provided)
      setActiveCategory(params.category || 'All');
      // close modal if open
      const modalEl = document.getElementById('filtersModal');
      if (modalEl) {
        // bootstrap 5: hide via Modal API if present
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
    } catch (err) {
      console.error('Fetch error', err);
    }
  }

  // Set active class on category buttons
  function setActiveCategory(catName) {
    if (!categoryContainer) return;
    const links = categoryContainer.querySelectorAll('.category-link');
    links.forEach(a => {
      if ((a.dataset.category || 'All') === (catName || 'All')) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  }

  // Category link clicks -> AJAX
  if (categoryContainer) {
    categoryContainer.addEventListener('click', (e) => {
      const a = e.target.closest('.category-link');
      if (!a) return;
      e.preventDefault();
      const category = a.dataset.category || 'All';

      // Gather current filter values (from modal inputs if present)
      const params = {
        category,
        search: document.getElementById('filterSearch')?.value || '',
        checkin: document.getElementById('filterCheckin')?.value || '',
        checkout: document.getElementById('filterCheckout')?.value || '',
        guests: document.getElementById('filterGuests')?.value || '',
        minPrice: document.getElementById('filterMinPrice')?.value || '',
        maxPrice: document.getElementById('filterMaxPrice')?.value || ''
      };

      fetchListings(params);
    });
  }

  // Filters form submit -> AJAX
  if (filtersForm) {
    filtersForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const params = {
        category: document.getElementById('filterCategory')?.value || 'All',
        search: document.getElementById('filterSearch')?.value || '',
        checkin: document.getElementById('filterCheckin')?.value || '',
        checkout: document.getElementById('filterCheckout')?.value || '',
        guests: document.getElementById('filterGuests')?.value || '',
        minPrice: document.getElementById('filterMinPrice')?.value || '',
        maxPrice: document.getElementById('filterMaxPrice')?.value || ''
      };
      fetchListings(params);
    });
  }

  // Tax switch toggles price presentation (no server call)
  if (taxSwitch) {
    taxSwitch.addEventListener('change', () => {
      // toggle display for already-rendered cards
      const priceEls = document.querySelectorAll('.price-display');
      priceEls.forEach(el => {
        const base = Number(el.dataset.basePrice || 0);
        if (taxSwitch.checked) {
          el.textContent = '₹' + base.toLocaleString('en-IN') + ' night';
        } else {
          const total = Math.round(base * (1 + TAX_RATE));
          el.textContent = '₹' + total.toLocaleString('en-IN') + ' total incl tax';
        }
      });
    });
  }

  // Optional: initial active highlight (based on server rendered "active" class or category in DOM)
  // If server didn't mark active, do nothing. Alternatively, we could fetch initial filters from server.
});
