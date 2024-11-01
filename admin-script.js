const firebaseConfig = {
    apiKey: "AIzaSyC61LqMCJ2u94FFP_ficTFi0qAm2s2b5zk",
    authDomain: "cansufurkan-8514f.firebaseapp.com",
    databaseURL: "https://cansufurkan-8514f-default-rtdb.firebaseio.com",
    projectId: "cansufurkan-8514f",
    storageBucket: "cansufurkan-8514f.appspot.com",
    messagingSenderId: "469450478703",
    appId: "1:469450478703:web:6019d7a41b6508a9b1299a",
    measurementId: "G-5B0936W17P"
  };
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();
const auth = firebase.auth();
let file;

// Giriş işlemi
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            document.getElementById('loginDiv').style.display = 'none';
            document.getElementById('adminContent').style.display = 'block';
            loadCategories();
            loadProducts();
        })
        .catch((error) => {
            alert('Giriş başarısız: ' + error.message);
        });
}

// Çıkış işlemi
function logout() {
    auth.signOut().then(() => {
        document.getElementById('loginDiv').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
    });
}

// Kategorileri yükleme
function loadCategories() {
    const categoriesList = document.getElementById('categoriesList');
    const productCategorySelect = document.getElementById('productCategory');
    const filterCategorySelect = document.getElementById('filterCategory');
    const updateProductCategorySelect = document.getElementById('updateProductCategory');
    categoriesList.innerHTML = '';
    productCategorySelect.innerHTML = '<option value="">Kategori Seçin</option>';
    filterCategorySelect.innerHTML = '<option value="">Hepsi</option>';
    updateProductCategorySelect.innerHTML = '<option value="">Kategori Seçin</option>';

    database.ref('Categories').once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const category = childSnapshot.val();
            const categoryId = childSnapshot.key;
            const categoryNames = category.names;

            const categoryName = categoryNames['tr'];

            // Kategori listesine ekleme
            const div = document.createElement('div');
            div.textContent = categoryName;
            categoriesList.appendChild(div);

            // Ürün ekleme formundaki kategori seçimine ekleme
            const option = document.createElement('option');
            option.value = categoryId;
            option.textContent = categoryName;
            productCategorySelect.appendChild(option);

            // Ürün filtreleme için kategori seçimine ekleme
            const filterOption = document.createElement('option');
            filterOption.value = categoryId;
            filterOption.textContent = categoryName;
            filterCategorySelect.appendChild(filterOption);

            // Ürün güncelleme formundaki kategori seçimine ekleme
            const updateOption = document.createElement('option');
            updateOption.value = categoryId;
            updateOption.textContent = categoryName;
            updateProductCategorySelect.appendChild(updateOption);
        });
    });
}

// Yeni kategori ekleme
document.getElementById('newCategoryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const names = {
        tr: document.getElementById('categoryName_tr').value,
        en: document.getElementById('categoryName_en').value,
        ru: document.getElementById('categoryName_ru').value,
        ar: document.getElementById('categoryName_ar').value
    };
    const categoryImage = document.getElementById('categoryImage').files[0];

    // İlerleme çubuğunu göster
    document.getElementById('categoryProgressBar').style.display = 'block';

    // Resmi Firebase Storage'a yükleyin
    const storageRef = storage.ref('categoryImages/' + categoryImage.name);
    const uploadTask = storageRef.put(categoryImage);

    uploadTask.on('state_changed',
        (snapshot) => {
            // İlerleme yüzdesini hesapla
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            document.getElementById('categoryProgressBarFill').style.width = progress + '%';
            document.getElementById('categoryProgressBarFill').textContent = Math.round(progress) + '%';
        },
        (error) => {
            alert('Yükleme hatası: ' + error.message);
        },
        () => {
            uploadTask.snapshot.ref.getDownloadURL().then((url) => {
                const newCategoryKey = database.ref().child('Categories').push().key;
                database.ref('Categories/' + newCategoryKey).set({
                    names: names,
                    imageUrl: url
                }).then(() => {
                    alert('Kategori başarıyla eklendi!');
                    document.getElementById('newCategoryForm').reset();
                    document.getElementById('categoryImagePreview').style.display = 'none';
                    document.getElementById('categoryProgressBar').style.display = 'none';
                    loadCategories();
                });
            });
        }
    );
});

// Kategori resmi önizleme
document.getElementById('categoryImage').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('categoryImagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Ürünleri yükleme
function loadProducts() {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '';

    const selectedCategory = document.getElementById('filterCategory').value;

    database.ref('Products').once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            const productId = childSnapshot.key;
            const productName = product.names['tr'];
            const categoryId = product.categoryId;

            // Eğer kategori filtrelemesi yapılıyorsa
            if (selectedCategory === '' || selectedCategory === categoryId) {
                // Kategori ismini almak için
                database.ref('Categories/' + categoryId).once('value', (categorySnapshot) => {
                    const categoryNames = categorySnapshot.val().names;
                    const categoryName = categoryNames['tr'];

                    const div = document.createElement('div');
                    div.classList.add('product-item');
                    div.innerHTML = `
                        <img src="${product.imageUrl}" alt="${productName}">
                        <span>${productName} - ${categoryName}</span>
                        <button onclick="openUpdateModal('${productId}')">Güncelle</button>
                        <button onclick="deleteProduct('${productId}')" class="delete-button">
                            🗑️
                        </button>
                    `;
                    productsList.appendChild(div);
                });
            }
        });
    });
}

// Kategori filtreleme değiştiğinde ürünleri yeniden yükle
document.getElementById('filterCategory').addEventListener('change', loadProducts);

// Yeni ürün ekleme
document.getElementById('newProductForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const names = {
        tr: document.getElementById('productName_tr').value,
        en: document.getElementById('productName_en').value,
        ru: document.getElementById('productName_ru').value,
        ar: document.getElementById('productName_ar').value
    };
    const descriptions = {
        tr: document.getElementById('productDesc_tr').value,
        en: document.getElementById('productDesc_en').value,
        ru: document.getElementById('productDesc_ru').value,
        ar: document.getElementById('productDesc_ar').value
    };
    const price = document.getElementById('productPrice').value;
    const categoryId = document.getElementById('productCategory').value;
    file = document.getElementById('fileElem').files[0];

    // İlerleme çubuğunu göster
    document.getElementById('productProgressBar').style.display = 'block';

    const storageRef = storage.ref('productImages/' + file.name);
    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed',
        (snapshot) => {
            // İlerleme yüzdesini hesapla
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            document.getElementById('productProgressBarFill').style.width = progress + '%';
            document.getElementById('productProgressBarFill').textContent = Math.round(progress) + '%';
        },
        (error) => {
            alert('Yükleme hatası: ' + error.message);
        },
        () => {
            uploadTask.snapshot.ref.getDownloadURL().then((url) => {
                const newProductKey = database.ref().child('Products').push().key;
                database.ref('Products/' + newProductKey).set({
                    names: names,
                    descriptions: descriptions,
                    price: price,
                    categoryId: categoryId,
                    imageUrl: url
                }).then(() => {
                    alert('Ürün başarıyla eklendi!');
                    document.getElementById('newProductForm').reset();
                    document.getElementById('productImagePreview').style.display = 'none';
                    document.getElementById('productProgressBar').style.display = 'none';
                    loadProducts();
                });
            });
        }
    );
});

// Ürün resmi önizleme
document.getElementById('fileElem').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('productImagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Ürün Güncelleme Modalını Açma
function openUpdateModal(productId) {
    const modal = document.getElementById('updateProductModal');
    modal.style.display = 'block';

    // Ürün bilgilerini doldurma
    database.ref('Products/' + productId).once('value', (snapshot) => {
        const product = snapshot.val();

        document.getElementById('updateProductId').value = productId;
        document.getElementById('updateProductName_tr').value = product.names['tr'];
        document.getElementById('updateProductName_en').value = product.names['en'];
        document.getElementById('updateProductName_ru').value = product.names['ru'];
        document.getElementById('updateProductName_ar').value = product.names['ar'];

        document.getElementById('updateProductDesc_tr').value = product.descriptions['tr'];
        document.getElementById('updateProductDesc_en').value = product.descriptions['en'];
        document.getElementById('updateProductDesc_ru').value = product.descriptions['ru'];
        document.getElementById('updateProductDesc_ar').value = product.descriptions['ar'];

        document.getElementById('updateProductPrice').value = product.price;
        document.getElementById('updateProductCategory').value = product.categoryId;

        // Mevcut ürün resmini önizleme olarak göster
        const preview = document.getElementById('updateProductImagePreview');
        preview.src = product.imageUrl;
        preview.style.display = 'block';
    });
}

// Ürün güncelleme formunda resim seçildiğinde önizleme
document.getElementById('updateFileElem').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('updateProductImagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Modalı Kapatma
document.getElementById('closeModal').onclick = function() {
    document.getElementById('updateProductModal').style.display = 'none';
};

// Ürün Güncelleme
document.getElementById('updateProductForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const productId = document.getElementById('updateProductId').value;
    const names = {
        tr: document.getElementById('updateProductName_tr').value,
        en: document.getElementById('updateProductName_en').value,
        ru: document.getElementById('updateProductName_ru').value,
        ar: document.getElementById('updateProductName_ar').value
    };
    const descriptions = {
        tr: document.getElementById('updateProductDesc_tr').value,
        en: document.getElementById('updateProductDesc_en').value,
        ru: document.getElementById('updateProductDesc_ru').value,
        ar: document.getElementById('updateProductDesc_ar').value
    };
    const price = document.getElementById('updateProductPrice').value;
    const categoryId = document.getElementById('updateProductCategory').value;
    const file = document.getElementById('updateFileElem').files[0];

    // İlerleme çubuğunu göster
    document.getElementById('updateProgressBar').style.display = 'block';

    if (file) {
        // Yeni resim yüklenecekse
        const storageRef = storage.ref('productImages/' + file.name);
        const uploadTask = storageRef.put(file);

        uploadTask.on('state_changed',
            (snapshot) => {
                // İlerleme yüzdesini hesapla
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                document.getElementById('updateProgressBarFill').style.width = progress + '%';
                document.getElementById('updateProgressBarFill').textContent = Math.round(progress) + '%';
            },
            (error) => {
                alert('Yükleme hatası: ' + error.message);
            },
            () => {
                uploadTask.snapshot.ref.getDownloadURL().then((url) => {
                    updateProduct(productId, names, descriptions, price, categoryId, url);
                });
            }
        );
    } else {
        // Resim değişmeyecekse
        database.ref('Products/' + productId).once('value', (snapshot) => {
            const product = snapshot.val();
            updateProduct(productId, names, descriptions, price, categoryId, product.imageUrl);
        });
    }
});

function updateProduct(productId, names, descriptions, price, categoryId, imageUrl) {
    database.ref('Products/' + productId).set({
        names: names,
        descriptions: descriptions,
        price: price,
        categoryId: categoryId,
        imageUrl: imageUrl
    }).then(() => {
        alert('Ürün başarıyla güncellendi!');
        document.getElementById('updateProductModal').style.display = 'none';
        document.getElementById('updateProgressBar').style.display = 'none';
        loadProducts();
    });
}
function deleteProduct(productId) {
    const confirmDelete = confirm("Bu ürünü silmek istediğinizden emin misiniz?");
    if (confirmDelete) {
        database.ref('Products/' + productId).remove()
            .then(() => {
                alert("Ürün başarıyla silindi!");
                loadProducts(); // Ürün listesini yeniden yükler
            })
            .catch((error) => {
                alert("Silme hatası: " + error.message);
            });
    }
}
