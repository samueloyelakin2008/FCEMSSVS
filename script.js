const firebaseConfig = {
  apiKey: "AIzaSyByA7u_WW_9I9bPJqo3H2CAzSLhlR6wfZs",
  authDomain: "fcemss-vs.firebaseapp.com",
  projectId: "fcemss-vs",
  storageBucket: "fcemss-vs.appspot.com",
  messagingSenderId: "544176890357",
  appId: "1:544176890357:web:a7872edda2ef70884880bc",
};

const cloudName = "dh1l6qygz";
const unsignedUploadPreset = "FCEMSSVS";

const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database(app);
const imagesRef = database.ref("gallery-images");

const gallery = document.querySelector(".image-container");
const addImageBtn = document.getElementById("add-image-btn");

const DAILY_LIMIT = 60;
const LOCAL_STORAGE_KEY = "dailyUploadData";

imagesRef.on("child_added", (snapshot) => {
  const imageData = snapshot.val();
  if (imageData && imageData.url) {
    const caption = imageData.name || `Gallery Image ${imageData.index || ""}`;
    const imageBlock = createImageBlock(imageData.url, caption);
    gallery.insertBefore(imageBlock, addImageBtn);
  }
});

function preloadLocalImages() {
  for (let i = 1; i <= 65; i++) {
    const src = `images/img${i}.jpg`;
    const imageBlock = createImageBlock(src, `Gallery Image ${i}`);
    gallery.insertBefore(imageBlock, addImageBtn);
  }
}
preloadLocalImages();

function getDailyUploadData() {
  const dataRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!dataRaw) return { date: null, count: 0 };
  try {
    return JSON.parse(dataRaw);
  } catch {
    return { date: null, count: 0 };
  }
}

function saveDailyUploadData(date, count) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ date, count }));
}

function isToday(dateString) {
  if (!dateString) return false;
  const savedDate = new Date(dateString);
  const now = new Date();
  return (
    savedDate.getFullYear() === now.getFullYear() &&
    savedDate.getMonth() === now.getMonth() &&
    savedDate.getDate() === now.getDate()
  );
}

function disableUploadButton(message) {
  addImageBtn.style.pointerEvents = "none";
  addImageBtn.style.opacity = "0.5";
  addImageBtn.title = message;
}

function checkUploadLimit() {
  const dailyData = getDailyUploadData();
  if (isToday(dailyData.date)) {
    if (dailyData.count >= DAILY_LIMIT) {
      disableUploadButton("Daily upload limit reached. Try again tomorrow.");
      return true;
    }
  } else {
    saveDailyUploadData(new Date().toISOString(), 0);
  }
  return false;
}

if (checkUploadLimit()) {
  // disabled on load if limit reached
}

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

addImageBtn.addEventListener("click", () => {
  if (!checkUploadLimit()) fileInput.click();
});

addImageBtn.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && !checkUploadLimit()) {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  let imageName = prompt("Enter a name for this image:", file.name);
  if (!imageName) {
    alert("Upload cancelled: image name is required");
    fileInput.value = "";
    return;
  }

  let dailyData = getDailyUploadData();
  if (!isToday(dailyData.date)) {
    dailyData.date = new Date().toISOString();
    dailyData.count = 0;
  }

  if (dailyData.count >= DAILY_LIMIT) {
    alert("Daily upload limit reached. Please try again tomorrow.");
    fileInput.value = "";
    return;
  }

  addImageBtn.innerHTML = '<div class="loading">Uploading...</div>';
  addImageBtn.style.pointerEvents = "none";

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", unsignedUploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.secure_url) {
      dailyData.count += 1;
      saveDailyUploadData(dailyData.date, dailyData.count);

      const newIndex = 65 + dailyData.count;

      await imagesRef.push({
        url: data.secure_url,
        uploadedAt: Date.now(),
        index: newIndex,
        name: imageName,
      });

      if (dailyData.count >= DAILY_LIMIT) {
        disableUploadButton("Daily upload limit reached. Try again tomorrow.");
      }
    } else {
      alert("Upload failed: " + (data.error?.message || "Unknown error"));
    }
  } catch (e) {
    console.error("Upload error:", e);
    alert("Upload failed, please try again.");
  } finally {
    addImageBtn.innerHTML =
      '<span class="plus-icon">+</span><p>Add Photo/Video</p><p>Max img-size:5MB</p><p>Max video-sze:50MB</p>';
    if (!checkUploadLimit()) {
      addImageBtn.style.pointerEvents = "auto";
      addImageBtn.title = "Click or press enter to upload a photo";
    }
    fileInput.value = "";
  }
});

function createImageBlock(src, caption) {
  const block = document.createElement("div");
  block.className = "image-block";
  block.innerHTML = `<img src="${src}" alt="${caption}" loading="lazy"><p>${caption}</p>`;

  const imageModal = document.getElementById("image-modal");
  const modalImage = document.getElementById("modal-img");
  block.querySelector("img").addEventListener("click", () => {
    modalImage.src = src;
    modalImage.alt = caption;
    imageModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    modalCloseBtn.focus();
  });

  return block;
}

const imageModal = document.getElementById("image-modal");
const modalCloseBtn = document.getElementById("modal-close");
modalCloseBtn.addEventListener("click", closeModal);
imageModal.addEventListener("click", e => {
  if (e.target === imageModal) closeModal();
});
window.addEventListener("keydown", e => {
  if ((e.key === "Escape" || e.key === "Esc") && imageModal.style.display === "flex") {
    closeModal();
  }
});

function closeModal() {
  imageModal.style.display = "none";
  document.getElementById("modal-img").src = "";
  document.body.style.overflow = "";
  addImageBtn.focus();
}

function toggleContent(contentId, btn) {
  const content = document.getElementById(contentId);
  const collapsed = content.classList.contains("collapsed");

  if (collapsed) {
    content.classList.remove("collapsed");
    btn.textContent = "Show Less";
  } else {
    content.classList.add("collapsed");
    btn.textContent = "Show More";
  }
}
window.toggleContent = toggleContent;
