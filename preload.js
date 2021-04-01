var ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on('newWindowData', function (event, data) {
    console.log(data);
    ipcRenderer.send('newLogReader', data)
});

ipcRenderer.on('log_msg', function (event, data) {
    console.log(data);
    document.getElementById('log').innerHTML += `<div class="card mt-1"><div class="card-body"><p class="card-text">${data}</p></div></div>`
});



ipcRenderer.on('getInstances', function (event, data) {
    console.log(data);
    instances = data
});

ipcRenderer.send('getInstances')

var instances = {}
console.log('Preload are loaded!');