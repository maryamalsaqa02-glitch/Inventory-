const products = [
  {name:'Product 1',sku:'SKU-1042',category:'Oils',zone:'B-02',stock:24,min:60},
  {name:'Product 2',sku:'SKU-2210',category:'Grains',zone:'A-12',stock:18,min:50},
  {name:'Product 3',sku:'SKU-3087',category:'Grains',zone:'A-14',stock:31,min:80},
  {name:'Product 4',sku:'SKU-1195',category:'Canned',zone:'C-03',stock:6,min:40},
  {name:'Product 5',sku:'SKU-2301',category:'Baking',zone:'D-07',stock:0,min:45},
  {name:'Product 6',sku:'SKU-2410',category:'Baking',zone:'D-08',stock:420,min:100},
  {name:'Product 7',sku:'SKU-2215',category:'Grains',zone:'A-13',stock:96,min:40},
  {name:'Product 8',sku:'SKU-1051',category:'Oils',zone:'B-03',stock:140,min:50}
];

const translations = {
  en: {
    pageTitle:'Inventory · Smart Warehouse', brand:'Smart Warehouse', operations:'Operations', planning:'Planning',
    dashboard:'Dashboard', alerts:'Alerts', inventory:'Inventory', forecast:'AI forecast', orders:'Purchase orders', suppliers:'Suppliers', reports:'Reports',
    subtitle:'All products currently in the warehouse', search:'Search products, SKUs...', add:'Add Product',
    filters:['All products','In stock','Low stock','Out of stock'], stats:['Total Products','Low Stock Items','Out of Stock'],
    weekly:'+4.2% vs last week', reorder:'Needs reorder soon', action:'Action required', products:'Products',
    categoryTitle:'Stock by category', categories:['Product 1','Product 2','Product 3','Product 4'], units:'units',
    columns:['PRODUCT','SKU','CATEGORY','ZONE','IN STOCK','MIN','STATUS','ACTIONS'], statuses:{out:'Out',critical:'Critical',low:'Low',stock:'In stock'}, edit:'Edit',
    empty:'No products match your search.', productName:'Product name', skuCode:'SKU', category:'Category', zone:'Zone', inStock:'In stock', minimumQuantity:'Minimum quantity',
    addTitle:'Add product', editTitle:'Edit product', cancel:'Cancel', save:'Save product', saveChanges:'Save changes',
    notifications:'Notifications', notificationLow:'37 products are running low and may need reordering.', notificationOut:'9 products are out of stock and need action.', reviewLow:'Review low stock',
    navMessage:'{section} section selected.', home:'Smart Warehouse home', manager:'Warehouse Manager', role:'Manager', language:'Language', close:'Close'
  },
  ar: {
    pageTitle:'المخزون · المستودع الذكي', brand:'المستودع الذكي', operations:'العمليات', planning:'التخطيط',
    dashboard:'لوحة التحكم', alerts:'التنبيهات', inventory:'المخزون', forecast:'توقعات الذكاء الاصطناعي', orders:'أوامر الشراء', suppliers:'الموردون', reports:'التقارير',
    subtitle:'جميع المنتجات الموجودة حاليًا في المستودع', search:'ابحث عن منتج أو رمز SKU...', add:'إضافة منتج',
    filters:['كل المنتجات','متوفر بالمخزون','مخزون منخفض','نفد من المخزون'], stats:['إجمالي المنتجات','منتجات منخفضة المخزون','نفد من المخزون'],
    weekly:'زيادة ٤٫٢٪ مقارنة بالأسبوع الماضي', reorder:'تحتاج إلى إعادة طلب قريبًا', action:'يتطلب إجراءً', products:'المنتجات',
    categoryTitle:'المخزون حسب الفئة', categories:['\u0627\u0644\u0645\u0646\u062a\u062c ١','\u0627\u0644\u0645\u0646\u062a\u062c ٢','\u0627\u0644\u0645\u0646\u062a\u062c ٣','\u0627\u0644\u0645\u0646\u062a\u062c ٤'], units:'وحدة',
    columns:['المنتج','رمز المنتج','الفئة','المنطقة','الكمية','الحد الأدنى','الحالة','إجراءات'], statuses:{out:'نفد',critical:'حرج',low:'منخفض',stock:'متوفر'}, edit:'تعديل',
    empty:'لا توجد منتجات تطابق البحث.', productName:'اسم المنتج', skuCode:'رمز المنتج', category:'الفئة', zone:'المنطقة', inStock:'الكمية المتوفرة', minimumQuantity:'الحد الأدنى للكمية',
    addTitle:'إضافة منتج', editTitle:'تعديل المنتج', cancel:'إلغاء', save:'حفظ المنتج', saveChanges:'حفظ التعديلات',
    notifications:'التنبيهات', notificationLow:'يوجد ٣٧ منتجًا منخفض المخزون وقد تحتاج إلى إعادة طلب.', notificationOut:'نفد مخزون ٩ منتجات وتحتاج إلى إجراء.', reviewLow:'مراجعة المخزون المنخفض',
    navMessage:'تم اختيار قسم {section}.', home:'الرئيسية · المستودع الذكي', manager:'مدير المستودع', role:'مدير', language:'اللغة', close:'إغلاق'
  }
};

const rows = document.querySelector('#productRows');
const searchInput = document.querySelector('#searchInput');
const emptyState = document.querySelector('#emptyState');
const dialog = document.querySelector('#productDialog');
const form = document.querySelector('#productForm');
const notificationsDialog = document.querySelector('#notificationsDialog');
let activeFilter = 'all';
let editingIndex = null;
let currentLanguage = localStorage.getItem('inventory-language') || 'en';
let toastTimer;

function t(key) { return translations[currentLanguage][key]; }

function parseLocalizedNumber(value) {
  return Number(String(value).replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0)).replace(/[٬,\s]/g, ''));
}
function productLabel(index) {
  return currentLanguage === 'ar' ? `المنتج ${Number(index + 1).toLocaleString('ar-EG')}` : `Product ${index + 1}`;
}

function getStatus(product) {
  if (product.stock === 0) return {key:'out', className:'out', filter:'out'};
  if (product.stock < product.min * .25) return {key:'critical', className:'critical', filter:'low'};
  if (product.stock < product.min) return {key:'low', className:'low', filter:'low'};
  return {key:'stock', className:'stock', filter:'stock'};
}

function renderProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase(currentLanguage === 'ar' ? 'ar' : 'en');
  const visible = products.map((product, index) => ({product,index,status:getStatus(product)})).filter(({product,index,status}) => {
    const matchesFilter = activeFilter === 'all' || status.filter === activeFilter;
    const matchesQuery = `${productLabel(index)} product ${index + 1} ${product.sku} ${product.category} ${product.zone}`.toLocaleLowerCase().includes(query);
    return matchesFilter && matchesQuery;
  });
  rows.innerHTML = visible.map(({product,index,status}) => `
    <tr><td>${productLabel(index)}</td><td>${escapeHTML(product.sku)}</td><td>${productLabel(index)}</td>
      <td>${escapeHTML(product.zone)}</td><td>${product.stock.toLocaleString(currentLanguage === 'ar' ? 'ar-EG' : 'en-US')}</td><td>${product.min.toLocaleString(currentLanguage === 'ar' ? 'ar-EG' : 'en-US')}</td>
      <td><span class="status ${status.className}">${t('statuses')[status.key]}</span></td>
      <td><button class="edit-button" type="button" data-edit="${index}">${t('edit')}</button></td></tr>`).join('');
  emptyState.hidden = visible.length > 0;
}

function translateCategory(category) {
  return ({Grains:'الحبوب',Baking:'المخبوزات',Oils:'الزيوت',Canned:'المعلبات'})[category] || category;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}

function setFirstText(element, value) {
  const node = [...element.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
  if (node) node.textContent = value;
}

function applyLanguage(language) {
  currentLanguage = language;
  localStorage.setItem('inventory-language', language);
  const arabic = language === 'ar';
  const copy = translations[language];
  document.documentElement.lang = language;
  document.documentElement.dir = arabic ? 'rtl' : 'ltr';
  document.title = copy.pageTitle;
  document.querySelector('.brand').setAttribute('aria-label', `${copy.home} · Smart Warehouse`);
  document.querySelector('nav').setAttribute('aria-label', copy.operations);
  document.querySelector('.filters').setAttribute('aria-label', arabic ? 'تصفية المنتجات' : 'Filter products');
  document.querySelector('.stats').setAttribute('aria-label', arabic ? 'ملخص المخزون' : 'Inventory summary');
  document.querySelector('.nav-label').textContent = copy.operations;
  document.querySelector('.planning-label').textContent = copy.planning;
  const navKeys = ['dashboard','alerts','inventory','products','forecast','orders','suppliers','reports'];
  document.querySelectorAll('.nav-item').forEach((item,index) => setFirstText(item,copy[navKeys[index]]));
  const activeNavIndex = [...document.querySelectorAll('.nav-item')].findIndex(item => item.classList.contains('active'));
  const currentSection = navKeys[activeNavIndex < 0 ? 2 : activeNavIndex];
  document.querySelector('.heading h1').textContent = copy[currentSection];
  document.querySelector('.heading p').textContent = currentSection === 'inventory' ? copy.subtitle : '';
  searchInput.placeholder = copy.search;
  searchInput.setAttribute('aria-label',copy.search);
  document.querySelector('#addProduct').textContent = copy.add;
  document.querySelector('#notificationsButton').setAttribute('aria-label',copy.notifications);
  document.querySelector('.language-switch').setAttribute('aria-label',copy.language);
  document.querySelectorAll('.filter').forEach((button,index) => button.textContent = copy.filters[index]);
  document.querySelectorAll('.stat-card').forEach((card,index) => {
    card.querySelector('p').textContent = copy.stats[index];
    card.querySelector('small').textContent = [copy.weekly,copy.reorder,copy.action][index];
    const value = ['1,248','37','9'][index];
    card.querySelector('strong').textContent = arabic ? Number(value.replace(',','')).toLocaleString('ar-EG') : value;
  });
  document.querySelectorAll('.nav-count').forEach((badge,index) => badge.textContent = arabic ? [5,6][index].toLocaleString('ar-EG') : [5,6][index]);
  document.querySelector('.people i').textContent = '5';
  document.querySelector('.products-panel h2').textContent = copy.products;
  document.querySelector('.category-panel h2').textContent = copy.categoryTitle;
  document.querySelectorAll('.category-row').forEach((row,index) => {
    const spans = row.querySelectorAll(':scope > div:first-child span');
    spans[0].textContent = copy.categories[index];
    const amount = [460,420,164,128][index];
    spans[1].textContent = `${amount.toLocaleString(arabic ? 'ar-EG' : 'en-US')} ${copy.units}`;
  });
  document.querySelectorAll('thead th').forEach((cell,index) => { if (index === 7) { cell.textContent = ''; cell.setAttribute('aria-label',copy.columns[index]); } else cell.textContent = copy.columns[index]; });
  emptyState.textContent = copy.empty;
  document.querySelector('#dialogTitle').textContent = editingIndex === null ? copy.addTitle : copy.editTitle;
  document.querySelector('[data-i18n="productName"]').childNodes[0].textContent = copy.productName;
  document.querySelector('[data-i18n="skuCode"]').childNodes[0].textContent = copy.skuCode;
  document.querySelector('[data-i18n="category"]').childNodes[0].textContent = copy.category;
  document.querySelector('[data-i18n="zone"]').childNodes[0].textContent = copy.zone;
  document.querySelector('[data-i18n="inStock"]').childNodes[0].textContent = copy.inStock;
  document.querySelector('[data-i18n="minimumQuantity"]').childNodes[0].textContent = copy.minimumQuantity;
  document.querySelector('[data-i18n="cancel"]').textContent = copy.cancel;
  document.querySelector('#saveProduct').textContent = editingIndex === null ? copy.save : copy.saveChanges;
  document.querySelectorAll('[data-i18n="notifications"]').forEach(el => el.textContent = copy.notifications);
  document.querySelector('[data-i18n="notificationLow"]').textContent = copy.notificationLow;
  document.querySelector('[data-i18n="notificationOut"]').textContent = copy.notificationOut;
  document.querySelector('#viewLowStock').textContent = copy.reviewLow;
  document.querySelector('#closeNotifications').setAttribute('aria-label',copy.close);
  document.querySelector('#productDialog .close-button').setAttribute('aria-label',copy.close);
  document.querySelector('#productDialog .eyebrow').textContent = copy.inventory;
  document.querySelector('#productDialog input[name="sku"]').placeholder = arabic ? 'رمز-١٠٥١' : 'SKU-1051';
  document.querySelector('#productDialog input[name="category"]').placeholder = 'e.g. Grains';
  document.querySelector('#productDialog input[name="zone"]').placeholder = arabic ? 'ب-٠٣' : 'B-03';
  document.querySelector('#productDialog input[name="stock"]').placeholder = arabic ? '١٤٠' : '140';
  document.querySelector('#productDialog input[name="min"]').placeholder = arabic ? '٥٠' : '50';
  const account = document.querySelector('.account');
  const accountExpanded = account.classList.contains('expanded');
  document.querySelector('.account-copy strong').textContent = arabic
    ? (accountExpanded ? '\u0627\u0644\u0645\u062e\u0632\u0646' : '\u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u062e\u0632\u0646')
    : (accountExpanded ? 'Warehouse' : 'Warehouse Manager');
  document.querySelector('.account-copy small').textContent = arabic ? '\u0645\u062f\u064a\u0631' : 'Manager';
  document.querySelector('.avatar').textContent = arabic ? '\u0645 \u0627' : 'WM';
  updateUsersPopupLanguage(arabic);
  document.querySelector('#englishButton').classList.toggle('selected',!arabic);
  document.querySelector('#arabicButton').classList.toggle('selected',arabic);
  document.querySelector('#englishButton').setAttribute('aria-pressed',String(!arabic));
  document.querySelector('#arabicButton').setAttribute('aria-pressed',String(arabic));
  renderProducts();
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'),2600);
}

function openProductDialog(index = null) {
  editingIndex = index;
  form.reset();
  applyLanguage(currentLanguage);
  form.elements.name.value = productLabel(index === null ? products.length : index);
  if (index !== null) {
    const product = products[index];
    for (const field of ['sku','category','zone','stock','min']) form.elements[field].value = field === 'category' ? productLabel(index) : field === 'min' && currentLanguage === 'ar' ? product.min.toLocaleString('ar-EG') : product[field];
  }
  dialog.showModal();
}

document.querySelector('.filters').addEventListener('click', event => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  activeFilter = button.dataset.filter;
  document.querySelectorAll('.filter').forEach(filter => {
    const selected = filter === button;
    filter.classList.toggle('active', selected);
    filter.setAttribute('aria-selected', String(selected));
  });
  renderProducts();
});

searchInput.addEventListener('input', renderProducts);
document.querySelector('#addProduct').addEventListener('click', () => openProductDialog());
rows.addEventListener('click', event => {
  const button = event.target.closest('[data-edit]');
  if (button) openProductDialog(Number(button.dataset.edit));
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const product = {name:productLabel(editingIndex === null ? products.length : editingIndex),sku:data.get('sku').trim(),category:data.get('category').trim(),zone:data.get('zone').trim(),stock:Number(data.get('stock')),min:parseLocalizedNumber(data.get('min'))};
  if (editingIndex === null) products.unshift(product);
  else products[editingIndex] = product;
  dialog.close();
  renderProducts();
  showToast(currentLanguage === 'ar' ? 'تم حفظ بيانات المنتج.' : 'Product saved.');
});

document.querySelector('#englishButton').addEventListener('click', () => applyLanguage('en'));
document.querySelector('#arabicButton').addEventListener('click', () => applyLanguage('ar'));
document.querySelector('#notificationsButton').addEventListener('click', () => notificationsDialog.showModal());
document.querySelector('#closeNotifications').addEventListener('click', () => notificationsDialog.close());
document.querySelector('#viewLowStock').addEventListener('click', () => {
  notificationsDialog.close();
  activeFilter = 'low';
  document.querySelectorAll('.filter').forEach(button => {
    const selected = button.dataset.filter === 'low';
    button.classList.toggle('active',selected);
    button.setAttribute('aria-selected',String(selected));
  });
  renderProducts();
  document.querySelector('.products-panel').scrollIntoView({behavior:'smooth',block:'start'});
});

document.querySelectorAll('.nav-item').forEach((item,index) => item.addEventListener('click',event => {
  if (item.getAttribute('href') !== '#') return;
  event.preventDefault();
  if (index === 3) return;
  document.querySelectorAll('.nav-item').forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
  });
  item.classList.add('active');
  item.setAttribute('aria-current','page');
  const section = translations[currentLanguage][['dashboard','alerts','inventory','products','forecast','orders','suppliers','reports'][index]];
  document.querySelector('.heading h1').textContent = section;
  if (index === 1) {
    document.querySelector('.heading p').textContent = '';
    notificationsDialog.showModal();
  }
  else if (index === 2) {
    document.querySelector('.heading p').textContent = t('subtitle');
    renderProducts();
  } else {
    document.querySelector('.heading p').textContent = '';
    showToast(t('navMessage').replace('{section}',section));
  }
}));

document.querySelector('.brand').addEventListener('click',event => {
  event.preventDefault();
  document.querySelectorAll('.nav-item').forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
  });
  document.querySelector('.nav-item:nth-of-type(3)').classList.add('active');
  document.querySelector('.nav-item:nth-of-type(3)').setAttribute('aria-current','page');
  document.querySelector('.heading h1').textContent = t('inventory');
  document.querySelector('.heading p').textContent = t('subtitle');
  renderProducts();
});

applyLanguage(currentLanguage);


function updateUsersPopupLanguage(arabic) {
  const button = document.querySelector('#usersButton');
  const popup = document.querySelector('#usersPopup');
  button.setAttribute('aria-label', arabic ? 'المستخدمون النشطون: ٥' : 'Active users: 5');
  button.querySelector('i').textContent = arabic ? '٥' : '5';
  popup.setAttribute('aria-label', arabic ? 'المستخدمون النشطون' : 'Active users');
  popup.querySelectorAll('[data-en][data-ar]').forEach(element => {
    element.textContent = arabic ? element.dataset.ar : element.dataset.en;
  });
  popup.querySelector('.users-online-number').textContent = arabic ? '٥' : '5';
  popup.querySelector('.tone-manager').textContent = arabic ? 'م ا' : 'WM';
  popup.querySelector('.signout-button').setAttribute('aria-label', arabic ? 'تسجيل الخروج' : 'Sign out');
}

const teamUsersButton = document.querySelector('#usersButton');
const teamUsersPopup = document.querySelector('#usersPopup');
const teamUsersList = teamUsersPopup.querySelector('.active-users-list');
const teamUsersTrack = teamUsersPopup.querySelector('.users-custom-scrollbar');
const teamUsersThumb = teamUsersTrack.querySelector('.users-custom-scrollbar-thumb');
let teamUsersDragging = false;
let teamUsersDragOffset = 0;

function positionTeamUsersPopup() {
  const rect = teamUsersButton.getBoundingClientRect();
  const width = Math.min(270, window.innerWidth - 24);
  const height = Math.min(343, window.innerHeight - 16);
  teamUsersPopup.style.width = String(width) + 'px';
  teamUsersPopup.style.height = String(height) + 'px';
  const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + rect.width / 2 - width / 2));
  let top = rect.top + rect.height / 2 - height - 12;
  if (top < 8) top = Math.min(window.innerHeight - height - 8, rect.bottom + 12);
  teamUsersPopup.style.left = String(left + window.scrollX) + 'px';
  teamUsersPopup.style.top = String(top + window.scrollY) + 'px';
  teamUsersPopup.style.setProperty('--users-arrow-left', String(Math.max(12, Math.min(width - 20, rect.left + rect.width / 2 - left - 4))) + 'px');
}

function syncTeamUsersScrollbar() {
  const viewport = teamUsersList.clientHeight;
  const content = teamUsersList.scrollHeight;
  const trackHeight = teamUsersTrack.clientHeight;
  if (!viewport || !trackHeight || content <= viewport + 1) {
    teamUsersTrack.hidden = true;
    return;
  }
  teamUsersTrack.hidden = false;
  const thumbHeight = Math.min(trackHeight, Math.max(22, trackHeight * viewport / content));
  const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
  const scrollRange = Math.max(1, content - viewport);
  teamUsersThumb.style.height = String(thumbHeight) + 'px';
  teamUsersThumb.style.transform = 'translateY(' + (maxThumbTop * teamUsersList.scrollTop / scrollRange) + 'px)';
}

function scrollTeamUsersToPointer(clientY, centerThumb = false) {
  const trackRect = teamUsersTrack.getBoundingClientRect();
  const thumbHeight = teamUsersThumb.offsetHeight;
  const maxThumbTop = Math.max(1, trackRect.height - thumbHeight);
  const offset = centerThumb ? thumbHeight / 2 : teamUsersDragOffset;
  const thumbTop = Math.max(0, Math.min(maxThumbTop, clientY - trackRect.top - offset));
  const maxScroll = Math.max(0, teamUsersList.scrollHeight - teamUsersList.clientHeight);
  teamUsersList.scrollTop = maxScroll * thumbTop / maxThumbTop;
}

function setTeamUsersPopup(open) {
  teamUsersPopup.hidden = !open;
  teamUsersPopup.setAttribute('aria-hidden', String(!open));
  teamUsersButton.setAttribute('aria-expanded', String(open));
  if (open) {
    positionTeamUsersPopup();
    requestAnimationFrame(syncTeamUsersScrollbar);
  }
}

teamUsersButton.addEventListener('click', event => {
  event.stopPropagation();
  setTeamUsersPopup(teamUsersPopup.hidden);
});
teamUsersPopup.addEventListener('click', event => event.stopPropagation());
document.addEventListener('click', () => setTeamUsersPopup(false));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') setTeamUsersPopup(false);
});
teamUsersTrack.addEventListener('pointerdown', event => {
  if (teamUsersTrack.hidden) return;
  if (event.target === teamUsersThumb) {
    teamUsersDragging = true;
    teamUsersDragOffset = event.clientY - teamUsersThumb.getBoundingClientRect().top;
    teamUsersThumb.setPointerCapture(event.pointerId);
    event.preventDefault();
  } else {
    scrollTeamUsersToPointer(event.clientY, true);
  }
});
teamUsersThumb.addEventListener('pointermove', event => {
  if (teamUsersDragging) scrollTeamUsersToPointer(event.clientY);
});
const stopTeamUsersDragging = () => { teamUsersDragging = false; };
teamUsersThumb.addEventListener('pointerup', stopTeamUsersDragging);
teamUsersThumb.addEventListener('pointercancel', stopTeamUsersDragging);
teamUsersList.addEventListener('scroll', syncTeamUsersScrollbar, { passive: true });
window.addEventListener('resize', () => {
  if (!teamUsersPopup.hidden) {
    positionTeamUsersPopup();
    syncTeamUsersScrollbar();
  }
}, { passive: true });
window.addEventListener('scroll', () => {
  if (!teamUsersPopup.hidden) positionTeamUsersPopup();
}, { passive: true, capture: true });
document.body.appendChild(teamUsersPopup);