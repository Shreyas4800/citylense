const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient('citylense-evidence');

const uploadImageToAzure = async (fileBuffer, fileName) => {
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: { blobContentType: 'image/jpeg' }
    });
    return blockBlobClient.url;
};

module.exports = { uploadImageToAzure };