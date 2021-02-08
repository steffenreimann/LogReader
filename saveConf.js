
const fs = require('fs');


exports.read = (file, callback) => {
    fs.readFile(file, (err, data) => {
        if (err) throw err;
        callback(JSON.parse(data))
    });
}

exports.write = (file, data) => {
    data = JSON.stringify(data);
    fs.writeFile(file, data, (err) => {
        if (err) throw err;
        console.log('Data written to file');
    });
}