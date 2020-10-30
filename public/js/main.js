var socket = io.connect();
console.log(' loaded');
var lineTemp

socket.on('getFile', (data) => {
    console.log(data);
    lineTemp = data
});



socket.on('data', (data) => {
    console.log(data);
});

socket.on('file', (data) => {
    console.log(data);
});

socket.on('newLine', (temp, data) => {
    addLine('lines', temp, data)
    scrolldown('lines')
});


function scrolldown(element) {
    var elem = document.getElementById(element);
    elem.scrollTop = elem.scrollHeight;
}

function addLine(element, temp, data) {
    document.getElementById(element).innerHTML += ejs.render(temp, data);
}

function loadFile() {
    socket.emit('getFile', 'line.ejs', function (params) {

    });
}


function loadCfg(callback) {
    socket.emit('getConfig', function (config) {
        console.log(config)
        callback(config)
    });
}

function CopyPath() {
    loadCfg(function (config) {
        copyToClipboard(config.path)
    })

}

function search() {
    var SearchString = searchInput.value
    console.log(SearchString)
    window.find(SearchString)
}
var searchInput = document.getElementById('search')
var searchBTN = document.getElementById('searchBTN')
searchBTN.addEventListener("click", search, false);


const copyToClipboard = str => {
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
};