let products = [];
let categories = JSON.parse(localStorage.getItem('secret_ange_categories')) || ["Visage", "Corps", "Cheveux", "Parfum"];
let config = {};

document.addEventListener('DOMContentLoaded', async () => {
    await fetchConfig();
    await fetchProducts();
    renderBoard();
    setupCategorySelect();
    
    document.getElementById('btn-add-product').addEventListener('click', () => openModal());
    document.getElementById('btn-add-category').addEventListener('click', () => createCategory());
    document.getElementById('product-form').addEventListener('submit', handleFormSubmit);

    // Settings Navigation
    document.getElementById('nav-settings').addEventListener('click', (e) => {
        e.preventDefault();
        showSection('settings');
    });

    const navLinks = document.querySelectorAll('.sidebar-link');
    navLinks[0].addEventListener('click', (e) => {
        e.preventDefault();
        showSection('catalogue');
    });
});

function showSection(sectionId) {
    const sections = ['catalogue', 'settings'];
    sections.forEach(s => {
        const el = document.getElementById(`section-${s}`);
        const nav = s === 'settings' ? document.getElementById('nav-settings') : document.querySelectorAll('.sidebar-link')[0];
        if (s === sectionId) {
            el.classList.remove('hidden');
            nav.classList.add('active');
            nav.classList.remove('opacity-60');
        } else {
            el.classList.add('hidden');
            nav.classList.remove('active');
            nav.classList.add('opacity-60');
        }
    });

    if (sectionId === 'settings') {
        populateSettingsUI();
    }
}

function populateSettingsUI() {
    const catSelect = document.getElementById('setting-active-category');
    catSelect.innerHTML = '<option value="Tous">Toutes les catégories</option>' + 
        categories.map(c => `<option value="${c}">${c}</option>`).join('');
    
    catSelect.value = config.active_category || 'Tous';
    
    // Gérer la visibilité
    const visContainer = document.getElementById('setting-categories-visibility');
    visContainer.innerHTML = '';
    categories.forEach(cat => {
        const isHidden = (config.hidden_categories || []).includes(cat);
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 p-1';
        div.innerHTML = `
            <input type="checkbox" id="vis-${cat}" class="hidden-cat-checkbox w-4 h-4 rounded bg-white/10" ${!isHidden ? 'checked' : ''}>
            <label for="vis-${cat}" class="text-[11px] text-gray-300 font-medium">${cat}</label>
        `;
        visContainer.appendChild(div);
    });

    document.getElementById('setting-address').value = config.location?.address || '';
    document.getElementById('setting-map-url').value = config.location?.map_url || '';
}

async function saveGlobalSettings() {
    config.active_category = document.getElementById('setting-active-category').value;
    
    // Récupérer les catégories à masquer
    const checkboxes = document.querySelectorAll('.hidden-cat-checkbox');
    config.hidden_categories = [];
    checkboxes.forEach(cb => {
        if (!cb.checked) {
            const catName = cb.id.replace('vis-', '');
            config.hidden_categories.push(catName);
        }
    });

    config.location = {
        address: document.getElementById('setting-address').value,
        map_url: document.getElementById('setting-map-url').value
    };

    console.log("Configuration mise à jour localement:", config);
    const jsonStr = JSON.stringify(config, null, 4);
    
    // Proposer le téléchargement puisque PHP n'est pas dispo sur Netlify
    downloadJSON(jsonStr, 'config.json');
    alert("Mode Statique : Le fichier 'config.json' a été généré. Remplacez le fichier existant par celui-ci pour appliquer les changements sur Netlify.");
}

async function fetchConfig() {
    try {
        const response = await fetch('config.json', { cache: 'no-store' });
        if (response.ok) {
            config = await response.json();
        }
    } catch (e) {
        console.warn("Could not load config.json.");
    }
}

async function fetchProducts() {
    try {
        const response = await fetch('products.json', { cache: 'no-store' });
        if (response.ok) {
            products = await response.json();
            syncCategories();
        }
    } catch (e) {
        products = JSON.parse(localStorage.getItem('secret_ange_products')) || [];
        syncCategories();
    }
}

function syncCategories() {
    products.forEach(p => {
        if (p.category && !categories.includes(p.category)) {
            categories.push(p.category);
        }
    });
    localStorage.setItem('secret_ange_categories', JSON.stringify(categories));
}

function setupCategorySelect() {
    const select = document.getElementById('p-category');
    select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function createCategory() {
    const name = prompt("Nom de la nouvelle catégorie :");
    if (name && name.trim()) {
        const cat = name.trim();
        if (!categories.includes(cat)) {
            categories.push(cat);
            localStorage.setItem('secret_ange_categories', JSON.stringify(categories));
            setupCategorySelect();
            renderBoard();
            initDragAndDrop();
        }
    }
}

function renderBoard() {
    const board = document.getElementById('category-board');
    board.innerHTML = '';

    categories.forEach(cat => {
        const catProducts = products.filter(p => p.category === cat);
        const col = document.createElement('div');
        col.className = 'flex flex-col gap-4';
        col.innerHTML = `
            <div class="flex justify-between items-center px-2">
                <h4 class="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">${cat}</h4>
                <span class="text-[10px] bg-white/10 px-2 py-1 rounded-full text-gray-400">${catProducts.length}</span>
            </div>
            <div class="category-column space-y-3 glass p-4 rounded-3xl min-h-[150px] border-white/5" data-category="${cat}" id="col-${cat}">
                ${catProducts.map(p => renderProductItem(p)).join('')}
            </div>
        `;
        board.appendChild(col);
    });
    initDragAndDrop();
}

function renderProductItem(p) {
    return `
        <div class="product-item glass p-4 rounded-2xl flex items-center justify-between border-white/5 group" data-id="${p.id}">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-white/10 rounded-xl overflow-hidden cursor-pointer" onclick="openPreview('${p.img}', '${p.name}')">
                    <img src="img/${p.img}" alt="${p.name}" class="w-full h-full object-cover">
                </div>
                <div>
                    <h5 class="text-xs font-bold uppercase tracking-tight">${p.name}</h5>
                    <p class="text-gold text-[10px] font-semibold">${p.price.toLocaleString()} FCFA</p>
                </div>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="editProduct(${p.id})" class="p-2 hover:bg-white/10 rounded-lg text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                </button>
                <button onclick="deleteProduct(${p.id})" class="p-2 hover:bg-white/10 rounded-lg text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        </div>
    `;
}

function openModal(id = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('product-form');
    
    if (id) {
        const p = products.find(prod => prod.id === id);
        document.getElementById('p-id').value = p.id;
        document.getElementById('p-name').value = p.name;
        document.getElementById('p-price').value = p.price;
        document.getElementById('p-category').value = p.category;
        document.getElementById('p-img').value = p.img;
        title.innerText = "Modifier le Secret";
    } else {
        form.reset();
        document.getElementById('p-id').value = '';
        title.innerText = "Ajouter un Secret";
    }
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('p-id').value;
    const name = document.getElementById('p-name').value;
    const price = parseInt(document.getElementById('p-price').value);
    const category = document.getElementById('p-category').value;
    const img = document.getElementById('p-img').value;

    if (id) {
        const index = products.findIndex(p => p.id == id);
        products[index] = { ...products[index], name, price, category, img };
    } else {
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, price, category, img });
    }

    saveAndRefresh();
    closeModal();
}

function editProduct(id) {
    openModal(id);
}

function deleteProduct(id) {
    if (confirm('Supprimer ce produit ?')) {
        products = products.filter(p => p.id !== id);
        saveAndRefresh();
    }
}

function initDragAndDrop() {
    document.querySelectorAll('.category-column').forEach(col => {
        new Sortable(col, {
            group: 'categories',
            animation: 150,
            onEnd: (evt) => {
                const productId = parseInt(evt.item.dataset.id);
                const newCategory = evt.to.dataset.category;
                const product = products.find(p => p.id === productId);
                if (product) {
                    product.category = newCategory;
                    saveAndRefresh();
                }
            }
        });
    });
}

function saveAndRefresh() {
    localStorage.setItem('secret_ange_products', JSON.stringify(products));
    saveToServer();
    renderBoard();
}

async function saveToServer() {
    console.log("Sauvegarde locale effectuée.");
    // Désactivé pour Netlify (pas de PHP)
    /*
    await fetch('save_products.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(products)
    });
    */
}

function exportProducts() {
    const jsonStr = JSON.stringify(products, null, 4);
    downloadJSON(jsonStr, 'products.json');
    alert("Fichier 'products.json' prêt ! Téléchargez-le et remplacez votre fichier actuel pour mettre à jour le site.");
}

function downloadJSON(content, fileName) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

function openPreview(img, name) {
    document.getElementById('preview-img').src = `img/${img}`;
    document.getElementById('preview-caption').innerText = name;
    document.getElementById('preview-modal').classList.remove('hidden');
}

function closePreview() {
    document.getElementById('preview-modal').classList.add('hidden');
}
