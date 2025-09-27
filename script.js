/* ---------------- Local Storage ---------------- */
const STORAGE_KEY = 'farmchain_produce_v1';

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch(e){ return []; }
}

function saveData(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
     // QR generation
function generateQRCode(entry) {
  const container = document.getElementById('qrCodeContainer');
  container.innerHTML = ""; // Clear previous QR code

  // QR data: encode crop info
  const qrData = JSON.stringify({
    id: entry.id,
    cropName: entry.cropName,
    location: entry.location,
    farmerName: entry.farmerName
  });

  // Create QR code
  new QRCode(container, {
    text: qrData,
    width: 180,
    height: 180,
    colorDark : "#0b5cff",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });

  // Optional: display QR ID below
  const qrString = document.createElement('p');
  qrString.textContent = "QR Code ID: " + entry.id;
  qrString.style.marginTop = "10px";
  qrString.style.fontWeight = "600";
  container.appendChild(qrString);
}
/* ---------------- QR & Produce Handling ---------------- */
function generateQRCodeString(entry) {
  return 'FC-' + entry.id;
}

function onFarmerSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const cropName = form.cropName.value.trim();
  const qty = Number(form.quantity.value);
  const location = form.location.value.trim();
  const price = Number(form.price.value);
  const farmerName = form.farmerName.value.trim() || 'Unknown Farmer';

  const list = loadData();
  const id = Date.now().toString(36) + '-' + Math.floor(Math.random()*9000);
  const entry = {
    id,
    cropName,
    quantity: qty,
    location,
    priceHistory: [price],
    farmerName,
    createdAt: Date.now(),
    qualityStatus: 'pending'
  };

  list.unshift(entry);
  saveData(list);
  form.reset();
  populateQRSelect();
  renderProduceList();
  alert('Produce registered. Generated QR: ' + generateQRCodeString(entry));
}

function populateQRSelect() {
  const sel = document.getElementById('qrSelect');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">-- Select QR Code --</option>';
  const list = loadData();
  list.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = generateQRCodeString(item) + ' • ' + item.cropName + ' • ' + item.location;
    sel.appendChild(opt);
  });
  if (current) sel.value = current;
}

function onTrace() {
  const sel = document.getElementById('qrSelect');
  if (!sel) return alert('No QR select element found.');
  const id = sel.value;
  if (!id) return alert('Please select a QR code (simulated).');

  const list = loadData();
  const item = list.find(i => i.id === id);
  if (!item) return alert('Selected QR not found.');

  document.getElementById('outFarmer').textContent = item.farmerName || '—';
  document.getElementById('outCrop').textContent = item.cropName;
  document.getElementById('outLocation').textContent = item.location;
  document.getElementById('outQty').textContent = item.quantity + ' kg';
  document.getElementById('outPrice').textContent = item.priceHistory.join(', ');
  document.getElementById('outQuality').textContent = (item.qualityStatus || 'pending').toUpperCase();
  document.getElementById('traceOut').style.display = 'block';
}

function renderProduceList() {
  const listEl = document.getElementById('produceList');
  if (!listEl) return;
  const list = loadData();
  const filterEl = document.getElementById('filterQuality');
  const filter = filterEl ? filterEl.value : 'all';

  listEl.innerHTML = '';
  const filtered = list.filter(i => filter === 'all' ? true : i.qualityStatus === filter);
  if (!filtered.length) {
    listEl.innerHTML = '<div style="padding:10px;color:#6b7280">No produce registered yet.</div>';
    return;
  }

  filtered.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'produce-item';
    itemEl.innerHTML = `
      <div style="display:flex;align-items:center">
        <div style="width:56px;height:56px;border-radius:8px;background:#eef2ff;display:flex;align-items:center;justify-content:center;font-weight:700;color:#0b4bd6">
          ${(item.cropName||'').slice(0,1).toUpperCase()}
        </div>
        <div class="produce-meta">
          <div style="font-weight:700">${item.cropName} <span style="font-weight:600;color:#475569">(${item.quantity} kg)</span></div>
          <div class="tags">${item.farmerName} • ${item.location}</div>
          <div style="font-size:12px;color:#64748b;margin-top:6px">QR: ${generateQRCodeString(item)}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
        <div style="font-weight:800">${item.qualityStatus.toUpperCase()}</div>
        <div style="display:flex;gap:6px">
          <button class="ghost" onclick="onVerify('${item.id}','verified')">Verify</button>
          <button class="ghost" onclick="onVerify('${item.id}','rejected')">Reject</button>
        </div>
      </div>
    `;
    listEl.appendChild(itemEl);
  });
}

function onVerify(id, newStatus) {
  const list = loadData();
  const idx = list.findIndex(i => i.id === id);
  if (idx === -1) return alert('Item not found');
  list[idx].qualityStatus = newStatus;
  if (newStatus === 'verified') {
    const lastPrice = list[idx].priceHistory[list[idx].priceHistory.length-1] || 0;
    list[idx].priceHistory.push(lastPrice);
  }
  saveData(list);
  populateQRSelect();
  renderProduceList();
}

function clearAllData() {
  if (!confirm('Clear all local data? This will remove all registered produce stored in this browser.')) return;
  localStorage.removeItem(STORAGE_KEY);
  populateQRSelect();
  renderProduceList();
  const traceOut = document.getElementById('traceOut');
  if (traceOut) traceOut.style.display = 'none';
}

/* ---------------- Seed Demo Data ---------------- */
(function seedIfEmpty(){
  const cur = loadData();
  if (cur.length === 0){
    const sample = [
      { id: 'demo-1', cropName:'Tomato', quantity:120, location:'Nashik', priceHistory:[28], farmerName:'Ramesh K', createdAt:Date.now()-2000000, qualityStatus:'pending' },
      { id: 'demo-2', cropName:'Wheat', quantity:500, location:'Ludhiana', priceHistory:[24], farmerName:'S. Singh', createdAt:Date.now()-1000000, qualityStatus:'verified' },
      { id: 'demo-3', cropName:'Potato', quantity:200, location:'West Bengal', priceHistory:[18], farmerName:'Pooja G', createdAt:Date.now()-500000, qualityStatus:'rejected' }
    ];
    saveData(sample);
  }
})();





/* ---------------- On DOM Load ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  populateQRSelect();
  renderProduceList();
});

function learnMore() {
  alert("FarmChain uses blockchain to ensure transparency in agriculture!");
}

/* ---------------- Google Maps Integration ---------------- */
let farmerMap, retailerMap;
let farmerInfowindow, retailerInfowindow;

function initMap() {
  const india = new google.maps.LatLng(20.5937, 78.9629);

  // Farmer Map
  farmerMap = new google.maps.Map(document.getElementById("mapFarmer"), {
    center: india,
    zoom: 5,
  });
  farmerInfowindow = new google.maps.InfoWindow();

  // Retailer Map
  retailerMap = new google.maps.Map(document.getElementById("mapRetailer"), {
    center: india,
    zoom: 5,
  });
  retailerInfowindow = new google.maps.InfoWindow();
}

function searchPlace(userType) {
  let query, map, infowindow;

  if (userType === "farmer") {
    query = document.getElementById("farmerSearch").value;
    map = farmerMap;
    infowindow = farmerInfowindow;
  } else {
    query = document.getElementById("retailerSearch").value;
    map = retailerMap;
    infowindow = retailerInfowindow;
  }

  const request = {
    query: query,
    fields: ["name", "geometry"],
  };

  const service = new google.maps.places.PlacesService(map);
  service.findPlaceFromQuery(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      map.setCenter(results[0].geometry.location);
      map.setZoom(12);

      results.forEach(place => {
        if (!place.geometry || !place.geometry.location) return;
        const marker = new google.maps.Marker({
          map,
          position: place.geometry.location,
        });
        google.maps.event.addListener(marker, "click", () => {
          infowindow.setContent(place.name || "");
          infowindow.open(map, marker);
        });
      });
    }
  });
}



  // Example: Farmer submission
  function onFarmerSubmit(e) {
    e.preventDefault();

    const entry = {
      id: Date.now().toString(),
      cropName: document.getElementById('cropName').value,
      quantity: document.getElementById('quantity').value,
      location: document.getElementById('location').value,
      farmerName: document.getElementById('farmerName').value,
      priceHistory: [parseFloat(document.getElementById('price').value)],
      quality: 'pending'
    };

    const list = JSON.parse(localStorage.getItem('produceList') || '[]');
    list.push(entry);
    localStorage.setItem('produceList', JSON.stringify(list));

    generateQRCode(entry); // generate QR code
    renderProduceList();   // update distributor list

    document.getElementById('farmerForm').reset();
  }

  // Generate QR code
  function generateQRCode(item) {
    const container = document.getElementById('qrCodeContainer');
    container.innerHTML = '';
    new QRCode(container, {
      text: JSON.stringify(item),
      width: 180,
      height: 180
    });
  }

  // Render distributor list
  function renderProduceList() {
    const list = JSON.parse(localStorage.getItem('produceList') || '[]');
    const container = document.getElementById('produceList');
    container.innerHTML = '';

    list.forEach(item => {
      const div = document.createElement('div');
      div.className = 'produce-item';
      div.innerHTML = `
        <div class="produce-meta">
          <strong>${item.cropName}</strong> by ${item.farmerName || 'N/A'}<br>
          Location: ${item.location}<br>
          Quantity: ${item.quantity} kg<br>
          <strong>Price History:</strong> ${item.priceHistory.join(' / ')} ₹/kg
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="number" placeholder="New Price" min="0" style="width:100px" id="newPrice-${item.id}">
          <button onclick="updateDistributorPrice('${item.id}')">Update Price</button>
        </div>
      `;
      container.appendChild(div);
    });
  }

  // Distributor updates price
  function updateDistributorPrice(id) {
    const list = JSON.parse(localStorage.getItem('produceList') || '[]');
    const item = list.find(i => i.id === id);
    if (!item) return alert("Item not found");

    const input = document.getElementById(`newPrice-${id}`);
    const newPrice = parseFloat(input.value);
    if (isNaN(newPrice) || newPrice <= 0) return alert("Enter a valid price");

    item.priceHistory.push(newPrice);
    localStorage.setItem('produceList', JSON.stringify(list));
    renderProduceList();
  }

  // Initialize
  document.getElementById('farmerForm').onsubmit = onFarmerSubmit;


