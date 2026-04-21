const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

const timestamp = Math.floor(Date.now() / 1000);
const signatureStr = `timestamp=${timestamp}${api_secret}`;
const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

async function testAxios() {
  try {
    const formData = new URLSearchParams();
    formData.append('file', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
    formData.append('api_key', api_key);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const response = await axios.post(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log("Success:", response.data);
  } catch (err) {
    if (err.response) {
      console.error("HTTP 403 Response Data:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}

testAxios();
