var ipcRenderer = require('electron').ipcRenderer;
var childprocess = require('child_process')
window.slash = require('slash');
const path = require('path')
const ejs = require('ejs')
const remote = require('electron').remote;
//var smmapi = require('satisfactory-mod-manager-api');
window.instances = {}

window.getInstances = async function (params) {

    const result = await ipcRenderer.invoke('getInstances');

    renderInstances(result)
    console.log(result); // prints "foo"
}

window.reopenWindow = async function (id) {
    console.log(window.instances)

    if (window.instances[id].WindowOpen) {

        const result = ipcRenderer.invoke('windowShow', id)
        console.log(result); // prints "foo"
    } else {
        const result = ipcRenderer.invoke('reopenWindow', id)
        console.log(result); // prints "foo"
    }



}

window.openFileInBrowser = function (filepath) {

    childprocess.exec(`start "" "${path.dirname(filepath)}"`);
}

window.quitInstance = async function (id) {
    const result = await ipcRenderer.invoke('quitInstance', id);
    return result
}

async function getHTMLView(data) {
    const result = await ipcRenderer.invoke('getHTMLView', data);
    return result
}


ipcRenderer.on('instancesChanged', function (event, data) {
    console.log(data);
    renderInstances(data)
    window.instances = data
});

async function renderInstances(instances) {
    var html = await getHTMLView('newReader')
    document.getElementById('instances').innerHTML = ''

    console.log('Render instances ', instances)

    Object.keys(instances).forEach(function (element) {
        console.log('Render element ', instances[element])
        document.getElementById('instances').innerHTML += ejs.render(html, { data: instances[element] });
    })
}

console.log('Preload are loaded!');
//console.log(smmapi);