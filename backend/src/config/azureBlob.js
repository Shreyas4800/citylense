const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || 'citylense-evidence';

const getCleanConnectionString = () => {
    const rawString =
        process.env.AZURE_STORAGE_CONNECTION_STRING ||
        process.env.AZURE_BLOB_CONNECTION_STRING ||
        process.env.AZURE_CONNECTION_STRING ||
        '';
    return rawString.trim().replace(/^["']|["']$/g, '');
};

const uploadImageToAzure = async (buffer, fileName) => {
    try {
        const connectionString = getCleanConnectionString();

        if (!connectionString || !connectionString.includes('AccountName=')) {
            console.warn('Azure Storage connection string missing. Using inline Base64 fallback.');
            return `data:image/jpeg;base64,${buffer.toString('base64')}`;
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

        await containerClient.createIfNotExists({ access: 'blob' });

        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: 'image/jpeg' }
        });

        return blockBlobClient.url;
    } catch (error) {
        console.error('Azure Blob upload fallback triggered:', error.message);
        return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }
};

const listEvidenceBlobs = async () => {
    try {
        const connectionString = getCleanConnectionString();
        if (!connectionString || !connectionString.includes('AccountName=')) return [];

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

        const blobs = [];
        for await (const blob of containerClient.listBlobsFlat()) {
            blobs.push({
                name: blob.name,
                url: `${containerClient.url}/${blob.name}`,
                createdOn: blob.properties.createdOn
            });
        }
        return blobs;
    } catch (error) {
        console.error('Error listing blobs:', error.message);
        return [];
    }
};

module.exports = { uploadImageToAzure, listEvidenceBlobs };