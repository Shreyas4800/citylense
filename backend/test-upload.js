const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const runTest = async () => {
    try {
        const form = new FormData();
        form.append('evidence', fs.createReadStream('./test.jpg'));
        form.append('latitude', '16.7050');
        form.append('longitude', '74.2433');

        const response = await axios.post('http://localhost:5000/api/reports/intake', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

runTest();