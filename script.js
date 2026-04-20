// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// Data storage
let bukuData = JSON.parse(localStorage.getItem('perpustakaan_buku')) || [];
let peminjamanData = JSON.parse(localStorage.getItem('perpustakaan_peminjaman')) || [];
let anggotaData = JSON.parse(localStorage.getItem('perpustakaan_anggota')) || [];
let editMode = false;
let editingId = null;
let currentTab = 'buku';

// Inisialisasi aplikasi
function initApp() {
    loadAllData();
    setupEventListeners();
    updateBukuDropdown();
    updateAnggotaDropdown();
    setDefaultDates();
    renderAllTables();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('formBuku').addEventListener('submit', handleBukuForm);
    document.getElementById('formPeminjaman').addEventListener('submit', handlePeminjamanForm);
    document.getElementById('formAnggota').addEventListener('submit', handleAnggotaForm);
}

// CRUD OPERATIONS - BUKU
function handleBukuForm(e) {
    e.preventDefault();
    
    const buku = {
        id: editingId || Date.now().toString(),
        judul: document.getElementById('judulBuku').value,
        penulis: document.getElementById('penulisBuku').value,
        penerbit: document.getElementById('penerbitBuku').value,
        tahun: document.getElementById('tahunBuku').value,
        isbn: document.getElementById('isbnBuku').value,
        stok: parseInt(document.getElementById('stokBuku').value),
        kategori: document.getElementById('kategoriBuku').value
    };

    if (editMode) {
        updateBuku(editingId, buku);
        showMessage('Buku berhasil diupdate!', 'success');
    } else {
        createBuku(buku);
        showMessage('Buku berhasil disimpan!', 'success');
    }

    resetForm('buku');
    renderBukuTable();
    updateBukuDropdown();
    saveData();
}

function createBuku(buku) {
    bukuData.push(buku);
}

function readBuku() {
    return bukuData;
}

function updateBuku(id, buku) {
    const index = bukuData.findIndex(b => b.id === id);
    if (index !== -1) {
        bukuData[index] = buku;
    }
}

function deleteBuku(id) {
    bukuData = bukuData.filter(b => b.id !== id);
    // Update stok pada peminjaman yang sudah dikembalikan
    peminjamanData.forEach(p => {
        if (p.status === 'dikembalikan' && p.bukuId === id) {
            const buku = bukuData.find(b => b.id === id);
            if (buku) buku.stok += 1;
        }
    });
}

// CRUD OPERATIONS - PEMINJAMAN
function handlePeminjamanForm(e) {
    e.preventDefault();
    
    const peminjaman = {
        id: editingId || Date.now().toString(),
        idAnggota: document.getElementById('idAnggota').value,
        bukuId: document.getElementById('idBukuPeminjaman').value,
        tglPinjam: document.getElementById('tglPinjam').value,
        tglJatuhTempo: document.getElementById('tglJatuhTempo').value,
        status: 'dipinjam'
    };

    if (editMode) {
        updatePeminjaman(editingId, peminjaman);
        showMessage('Peminjaman berhasil diupdate!', 'success');
    } else {
        if (checkStokTersedia(peminjaman.bukuId)) {
            createPeminjaman(peminjaman);
            kurangiStok(peminjaman.bukuId);
            showMessage('Peminjaman berhasil dibuat!', 'success');
        } else {
            showMessage('Stok buku tidak tersedia!', 'error');
            return;
        }
    }

    resetForm('peminjaman');
    renderPeminjamanTable();
    renderBukuTable();
    saveData();
}

function createPeminjaman(peminjaman) {
    peminjamanData.push(peminjaman);
}

function checkStokTersedia(bukuId) {
    const buku = bukuData.find(b => b.id === bukuId);
    return buku && buku.stok > 0;
}

function kurangiStok(bukuId) {
    const buku = bukuData.find(b => b.id === bukuId);
    if (buku) buku.stok -= 1;
}

function updatePeminjaman(id, peminjaman) {
    const index = peminjamanData.findIndex(p => p.id === id);
    if (index !== -1) {
        const oldPeminjaman = peminjamanData[index];
        // Jika status berubah dari dipinjam ke dikembalikan, tambah stok
        if (oldPeminjaman.status === 'dipinjam' && peminjaman.status === 'dikembalikan') {
            const buku = bukuData.find(b => b.id === oldPeminjaman.bukuId);
            if (buku) buku.stok += 1;
        }
        peminjamanData[index] = peminjaman;
    }
}

function deletePeminjaman(id) {
    const peminjaman = peminjamanData.find(p => p.id === id);
    if (peminjaman && peminjaman.status === 'dipinjam') {
        // Kembalikan stok jika hapus peminjaman yang masih dipinjam
        const buku = bukuData.find(b => b.id === peminjaman.bukuId);
        if (buku) buku.stok += 1;
    }
    peminjamanData = peminjamanData.filter(p => p.id !== id);
}

// CRUD OPERATIONS - ANGGOTA
function handleAnggotaForm(e) {
    e.preventDefault();
    
    const anggota = {
        id: editingId || Date.now().toString(),
        nama: document.getElementById('namaAnggota').value,
        noHp: document.getElementById('noHp').value,
        alamat: document.getElementById('alamat').value,
        tglDaftar: document.getElementById('tglDaftar').value
    };

    if (editMode) {
        updateAnggota(editingId, anggota);
        showMessage('Data anggota berhasil diupdate!', 'success');
    } else {
        createAnggota(anggota);
        showMessage('Anggota berhasil disimpan!', 'success');
    }

    resetForm('anggota');
    renderAnggotaTable();
    updateAnggotaDropdown();
    saveData();
}

function createAnggota(anggota) {
    anggotaData.push(anggota);
}

function updateAnggota(id, anggota) {
    const index = anggotaData.findIndex(a => a.id === id);
    if (index !== -1) {
        anggotaData[index] = anggota;
    }
}

function deleteAnggota(id) {
    anggotaData = anggotaData.filter(a => a.id !== id);
    updateAnggotaDropdown();
}

// UI Functions
function showTab(tabName) {
    currentTab = tabName;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

function resetForm(tab) {
    editMode = false;
    editingId = null;
    
    if (tab === 'buku') {
        document.getElementById('formBuku').reset();
    } else if (tab === 'peminjaman') {
        document.getElementById('formPeminjaman').reset();
        updateBukuDropdown();
        setDefaultDates();
    } else if (tab === 'anggota') {
        document.getElementById('formAnggota').reset();
        setDefaultDates();
    }
}

function editItem(dataType, id) {
    let item;
    
    switch(dataType) {
        case 'buku':
            item = bukuData.find(b => b.id === id);
            populateForm('buku', item);
            showTab('buku');
            break;
        case 'peminjaman':
            item = peminjamanData.find(p => p.id === id);
            if (item) {
                item.judulBuku = bukuData.find(b => b.id === item.bukuId)?.judul || 'Tidak ditemukan';
                populateForm('peminjaman', item);
                updateBukuDropdown(item.bukuId);
                updateAnggotaDropdown(item.idAnggota);
            }
            showTab('peminjaman');
            break;
        case 'anggota':
            item = anggotaData.find(a => a.id === id);
            populateForm('anggota', item);
            showTab('anggota');
            break;
    }
    
    editMode = true;
    editingId = id;
    document.querySelector('.modal').style.display = 'none';
}

function populateForm(formType, data) {
    if (formType === 'buku') {
        document.getElementById('judulBuku').value = data.judul || '';
        document.getElementById('penulisBuku').value = data.penulis || '';
        document.getElementById('penerbitBuku').value = data.penerbit || '';
        document.getElementById('tahunBuku').value = data.tahun || '';
        document.getElementById('isbnBuku').value = data.isbn || '';
        document.getElementById('stokBuku').value = data.stok || 0;
        document.getElementById('kategoriBuku').value = data.kategori || '';
    } else if (formType === 'peminjaman') {
        document.getElementById('idAnggota').value = data.idAnggota || '';
        document.getElementById('idBukuPeminjaman').value = data.bukuId || '';
        document.getElementById('tglPinjam').value = data.tglPinjam || '';
        document.getElementById('tglJatuhTempo').value = data.tglJatuhTempo || '';
    } else if (formType === 'anggota') {
        document.getElementById('namaAnggota').value = data.nama || '';
        document.getElementById('noHp').value = data.noHp || '';
        document.getElementById('alamat').value = data.alamat || '';
        document.getElementById('tglDaftar').value = data.tglDaftar || '';
    }
}

function deleteItem(dataType, id) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
        switch(dataType) {
            case 'buku': deleteBuku(id); break;
            case 'peminjaman': deletePeminjaman(id); break;
            case 'anggota': deleteAnggota(id); break;
        }
        renderAllTables();
        saveData();
        showMessage('Data berhasil dihapus!', 'success');
    }
}

// Rendering Functions
function renderBukuTable() {
    const tbody = document.querySelector('#bukuTable tbody');
    tbody.innerHTML = '';
    
    bukuData.forEach(buku => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${buku.id}</td>
            <td>${buku.judul}</td>
            <td>${buku.penulis}</td>
            <td>${buku.penerbit}</td>
            <td>${buku.tahun}</td>
            <td>${buku.isbn || '-'}</td>
            <td><span class="status ${buku.stok === 0 ? 'btn-danger' : 'btn-success'}">${buku.stok}</span></td>
            <td>${buku.kategori}</td>
            <td class="action-buttons">
                <button class="btn btn-warning" onclick="editItem('buku', '${buku.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteItem('buku', '${buku.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

function renderPeminjamanTable() {
    const tbody = document.querySelector('#peminjamanTable tbody');
    tbody.innerHTML = '';
    
    peminjamanData.forEach(peminjaman => {
        const buku = bukuData.find(b => b.id === peminjaman.bukuId);
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${peminjaman.id}</td>
            <td>${peminjaman.idAnggota}</td>
            <td>${peminjaman.bukuId}</td>
            <td>${buku ? buku.judul : 'Tidak ditemukan'}</td>
            <td>${formatDate(peminjaman.tglPinjam)}</td>
            <td>${formatDate(peminjaman.tglJatuhTempo)}</td>
            <td><span class="status ${peminjaman.status}">${peminjaman.status}</span></td>
            <td class="action-buttons">
                <button class="btn btn-warning" onclick="editItem('peminjaman', '${peminjaman.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteItem('peminjaman', '${peminjaman.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

function renderAnggotaTable() {
    const tbody = document.querySelector('#anggotaTable tbody');
    tbody.innerHTML = '';
    
    anggotaData.forEach(anggota => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${anggota.id}</td>
            <td>${anggota.nama}</td>
            <td>${anggota.noHp}</td>
            <td>${anggota.alamat || '-'}</td>
            <td>${formatDate(anggota.tglDaftar)}</td>
            <td class="action-buttons">
                <button class="btn btn-warning" onclick="editItem('anggota', '${anggota.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteItem('anggota', '${anggota.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

function renderAllTables() {
    renderBukuTable();
    renderPeminjamanTable();
    renderAnggotaTable();
}

// Utility Functions
function loadAllData() {
    bukuData = JSON.parse(localStorage.getItem('perpustakaan_buku')) || [];
    peminjamanData = JSON.parse(localStorage.getItem('perpustakaan_peminjaman')) || [];
    anggotaData = JSON.parse(localStorage.getItem('perpustakaan_anggota')) || [];
}

function saveData() {
    localStorage.setItem('perpustakaan_buku', JSON.stringify(bukuData));
    localStorage.setItem('perpustakaan_peminjaman', JSON.stringify(peminjamanData));
    localStorage.setItem('perpustakaan_anggota', JSON.stringify(anggotaData));
}

function updateBukuDropdown(selectedId = null) {
    const select = document.getElementById('idBukuPeminjaman');
    select.innerHTML = '<option value="">Pilih Buku</option>';
    
    bukuData.forEach(buku => {
        const option = document.createElement('option');
        option.value = buku.id;
        option.textContent = `${buku.judul} (${buku.penulis}) - Stok: ${buku.stok}`;
        if (selectedId === buku.id) option.selected = true;
        select.appendChild(option);
    });
}

function updateAnggotaDropdown(selectedId = null) {
    const select = document.getElementById('idAnggota');
    select.innerHTML = '<option value="">Pilih Anggota</option>';
    
    anggotaData.forEach(anggota => {
        const option = document.createElement('option');
        option.value = anggota.id;
        option.textContent = `${anggota.id} - ${anggota.nama}`;
        if (selectedId === anggota.id) option.selected = true;
        select.appendChild(option);
    });
}

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    const weekLaterStr = weekLater.toISOString().split('T')[0];
    
    if (currentTab === 'peminjaman') {
        document.getElementById('tglPinjam').value = today;
        document.getElementById('tglJatuhTempo').value = weekLaterStr;
    } else if (currentTab === 'anggota') {
        document.getElementById('tglDaftar').value = today;
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID');
}

function searchTable(tableId, searchTerm) {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function showMessage(message, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `${type}-msg fade-in`;
    msgDiv.textContent = message;
    msgDiv.id = 'temp-message';
    
    const container = document.querySelector('.tab-content.active .card');
    container.insertBefore(msgDiv, container.firstChild);
    
    setTimeout(() => {
        msgDiv.remove();
    }, 3000);
}

// Modal Functions (tidak digunakan dalam versi ini, tapi siap untuk ekspansi)
function openModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('editForm').innerHTML = content;
    document.getElementById('editModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Event listener untuk modal close
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Fungsi tambahan untuk status peminjaman
function updateStatusPeminjaman(id, newStatus) {
    const peminjaman = peminjamanData.find(p => p.id === id);
    if (peminjaman) {
        const oldStatus = peminjaman.status;
        peminjaman.status = newStatus;
        
        // Update stok jika status berubah ke dikembalikan
        if (oldStatus === 'dipinjam' && newStatus === 'dikembalikan') {
            const buku = bukuData.find(b => b.id === peminjaman.bukuId);
            if (buku) buku.stok += 1;
        }
        
        saveData();
        renderPeminjamanTable();
        renderBukuTable();
        showMessage(`Status peminjaman diupdate ke ${newStatus}!`, 'success');
    }
}

// Export data ke JSON (bonus feature)
function exportData() {
    const data = {
        buku: bukuData,
        peminjaman: peminjamanData,
        anggota: anggotaData,
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `perpustakaan_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Import data dari JSON (bonus feature)
function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (confirm('Apakah Anda yakin ingin mengganti semua data dengan file backup ini?')) {
                    bukuData = data.buku || [];
                    peminjamanData = data.peminjaman || [];
                    anggotaData = data.anggota || [];
                    saveData();
                    renderAllTables();
                    updateBukuDropdown();
                    updateAnggotaDropdown();
                    showMessage('Data berhasil diimport!', 'success');
                }
            } catch (error) {
                showMessage('Format file tidak valid!', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Tambahkan tombol export/import di header (opsional)
function addExportImportButtons() {
    const header = document.querySelector('.header');
    header.innerHTML += `
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="exportData()">
                <i class="fas fa-download"></i> Export Data
            </button>
            <label class="btn btn-secondary" style="cursor: pointer;">
                <i class="fas fa-upload"></i> Import Data
                <input type="file" accept=".json" onchange="importData(event)" style="display: none;">
            </label>
            <button class="btn btn-secondary" onclick="location.reload()">
                <i class="fas fa-sync-alt"></i> Refresh
            </button>
        </div>
    `;
}

// Print function untuk cetak laporan
function printReport(type) {
    let printContent;
    
    switch(type) {
        case 'buku':
            printContent = document.getElementById('buku').innerHTML;
            break;
        case 'peminjaman':
            printContent = document.getElementById('peminjaman').innerHTML;
            break;
        case 'anggota':
            printContent = document.getElementById('anggota').innerHTML;
            break;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Laporan ${type.toUpperCase()}</title>
                <link rel="stylesheet" href="style.css">
            </head>
            <body>${printContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}