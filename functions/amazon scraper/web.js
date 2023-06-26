const fs = require('fs');
const Path = require('path')
const Axios = require('axios')
const {sanitize} = require('./strings.js')

async function downloadImage(url, folder, filename) {

    let sanitized = sanitize(filename)
  
    let path = Path.resolve(__dirname, "Images", folder,  sanitized + ".png")
    fs.mkdirSync(path.slice(0, path.lastIndexOf("\\")), { recursive: true });
    const writer = fs.createWriteStream(path)
  
    const response = await Axios({
      url,
      method: 'GET',
      responseType: 'stream'
    })

    response.data.pipe(writer)
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
  }

module.exports = {downloadImage}