const firebaseConfig = {
  apiKey: "AIzaSyByA7u_WW_9I9bPJqo3H2CAzSLhlR6wfZs",
  authDomain: "fcemss-vs.firebaseapp.com",
  projectId: "fcemss-vs",
  storageBucket: "fcemss-vs.appspot.com",
  messagingSenderId: "544176890357",
  appId: "1:544176890357:web:a7872edda2ef70884880bc",
}

const cloudName = "dh1l6qygz"
const unsignedUploadPreset = "FCEMSSVS"

const app = firebase.initializeApp(firebaseConfig)
const database = firebase.database(app)
const imagesRef = database.ref("gallery-images")

const gallery = document.querySelector(".image-container")
const addImageBtn = document.getElementById("add-image-btn")

function preloadLocalImages() {
  for (let i=1; i<=65; i++) {
    const src = `images/img${i}.jpg`
    const block = createMediaBlock(src, `Gallery Image ${i}`, false)
    gallery.insertBefore(block, addImageBtn)
  }
}
preloadLocalImages()

const fileInput = document.createElement("input")
fileInput.type = "file"
fileInput.accept = "image/*,video/*"
fileInput.style.display = "none"
document.body.appendChild(fileInput)

addImageBtn.addEventListener("click", () => {
  fileInput.click()
})

addImageBtn.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    fileInput.click()
  }
})

fileInput.addEventListener("change", async e => {
  const file = e.target.files[0]
  if (!file) return

  let mediaName = prompt("Enter a name for this media:", file.name)
  if (!mediaName) {
    alert("Upload cancelled: media name is required")
    fileInput.value = ""
    return
  }

  if (file.type.startsWith("image/") && file.size > 5*1024*1024) {
    alert("Image size exceeds 5MB limit.")
    fileInput.value = ""
    return
  }
  if (file.type.startsWith("video/") && file.size > 50*1024*1024) {
    alert("Video size exceeds 50MB limit.")
    fileInput.value = ""
    return
  }

  addImageBtn.innerHTML = '<div class="loading">Uploading...</div>'
  addImageBtn.style.pointerEvents = "none"

  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", unsignedUploadPreset)

    const uploadUrl = file.type.startsWith("video/")
      ? `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
      : `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    })
    const data = await response.json()

    if (data.secure_url) {
      await imagesRef.push({
        url: data.secure_url,
        uploadedAt: Date.now(),
        name: mediaName,
        mediaType: file.type.startsWith("video/") ? "video" : "image"
      })
    } else {
      alert("Upload failed: " + (data.error?.message || "Unknown error"))
    }
  } catch(err) {
    console.error(err)
    alert("Upload failed, please try again.")
  } finally {
    addImageBtn.innerHTML = `
      <span class="plus-icon">+</span>
      <p>Add Photo/Video</p>
      <p>Max img-size: 5MB</p>
      <p>Max video-size: 50MB</p>
    `
    addImageBtn.style.pointerEvents = "auto"
    addImageBtn.title = "Click or press enter to upload a photo or video"
    fileInput.value = ""
  }
})

function createMediaBlock(src, caption, isVideo = false) {
  const block = document.createElement("div")
  block.className = "image-block"

  if (isVideo) {
    block.innerHTML = `<video src="${src}" controls preload="metadata"></video><p>${caption}</p>`
  } else {
    block.innerHTML = `<img src="${src}" alt="${caption}" loading="lazy"><p>${caption}</p>`
    const imageModal = document.getElementById("image-modal")
    const modalImage = document.getElementById("modal-img")
    const modalCloseBtn = document.getElementById("modal-close")
    block.querySelector("img").addEventListener("click", () => {
      modalImage.src = src
      modalImage.alt = caption
      imageModal.style.display = "flex"
      document.body.style.overflow = "hidden"
      modalCloseBtn.focus()
    })
  }
  return block
}

imagesRef.on("child_added", snapshot => {
  const mediaData = snapshot.val()
  if (mediaData && mediaData.url) {
    const isVideo = mediaData.mediaType === "video"
    const caption = mediaData.name || (isVideo ? "Gallery Video" : "Gallery Image")
    const block = createMediaBlock(mediaData.url, caption, isVideo)
    gallery.insertBefore(block, addImageBtn)
  }
})

const imageModal = document.getElementById("image-modal")
const modalCloseBtn = document.getElementById("modal-close")
modalCloseBtn.addEventListener("click", closeModal)
imageModal.addEventListener("click", e => {
  if (e.target === imageModal) closeModal()
})
window.addEventListener("keydown", e => {
  if ((e.key === "Escape" || e.key === "Esc") && imageModal.style.display === "flex") {
    closeModal()
  }
})

function closeModal() {
  imageModal.style.display = "none"
  document.getElementById("modal-img").src = ""
  document.body.style.overflow = ""
  addImageBtn.focus()
}

function toggleContent(contentId, button) {
  const content = document.getElementById(contentId)
  const isCollapsed = content.classList.contains("collapsed")
  if (isCollapsed) {
    content.classList.remove("collapsed")
    button.textContent = "Show Less"
  } else {
    content.classList.add("collapsed")
    button.textContent = "Show More"
  }
}
window.toggleContent = toggleContent
