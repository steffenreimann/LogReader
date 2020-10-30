var path = require('path');
exports.config = {
    updateRate: 5000,
    port: 3000,
    path: path.join(process.env.LOCALAPPDATA, 'FactoryGame', 'Saved', 'Logs', 'FactoryGame.log')
}