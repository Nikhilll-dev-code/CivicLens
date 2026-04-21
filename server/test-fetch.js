const crypto = require('crypto');
require('dotenv').config();

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

const timestamp = Math.floor(Date.now() / 1000);
const signatureStr = `timestamp=${timestamp}${api_secret}`;
const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

async function testFetch() {
  const formData = new URLSearchParams();
  formData.append('file', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
  formData.append('api_key', api_key);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const data = await response.json();
    console.log("HTTP Status:", response.status);
    console.log("Response Body:", data);
  } catch (err) {
    console.error("Fetch Error:", err.message);
  }
}

testFetch();
