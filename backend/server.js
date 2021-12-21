const http = require('http');
const app = require('./app');

// Fonction pour obtenir un port valide (value : string or number)
const normalizePort = val => {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
};
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

// Fonction pour recherche de différentes erreurs et gestion des erreurs
const errorHandler = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    // Enregistrement dans le serveur
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe' + address : 'port: ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges.');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use.');
            process.exit(1);
            break;
        default:
            throw error;
    }
};

const server = http.createServer(app);

// Ajout d'un événement "listen" sur l'adresse du port s'affichant dans la console
server.on('error', errorHandler);
server.on('listening', () => {
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
    console.log('Listening on ' + bind);
});

server.listen(port);