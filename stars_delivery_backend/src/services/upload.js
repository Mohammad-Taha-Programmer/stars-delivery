const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

async function uploadToCloud(imagePath) {
  if (!IMGBB_API_KEY) return null;

  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));

    const res = await axios.post('https://api.imgbb.com/1/upload', form, {
      params: { key: IMGBB_API_KEY },
      headers: form.getHeaders(),
      timeout: 15000,
    });

    if (res.data?.success) {
      return res.data.data.url;
    }
    return null;
  } catch (err) {
    console.error('ImgBB upload failed:', err.message);
    return null;
  }
}

async function uploadImagesToCloud(filePaths) {
  const urls = [];
  for (const fp of filePaths) {
    const url = await uploadToCloud(fp);
    if (url) urls.push(url);
  }
  return urls;
}

module.exports = { uploadToCloud, uploadImagesToCloud };
