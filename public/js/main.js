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


