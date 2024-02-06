const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 3000;

const MAX_CLIENTS = 5; // Número máximo de clientes que deseas manejar
let currentClientIndex = 0; // Índice del cliente actualmente en uso
const clients = []; // Matriz para almacenar clientes activos

async function initializeClient(clientId) {
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: clientId })
    });

    client.on('qr', qr => {
        qrcode.generate(qr, { small: true });
        console.log(`Escanea el código QR con la sesión "${clientId}"`);
    });

    client.on('ready', () => {
        console.log(`Cliente de la sesión "${clientId}" está listo!`);
        clients.push({ session: { name: clientId }, client, used: false }); // Agregar cliente a la lista de clientes activos
        if (clients.length === 1) {
            generateNextQR(); // Generar QR para el siguiente cliente después de que el primero esté listo
        }
    });

    client.on('disconnected', () => {
        console.log(`Cliente de la sesión "${clientId}" desconectado.`);
        // Aquí puedes manejar el evento de desconexión según tus necesidades
        // Por ejemplo, puedes intentar reconectar el cliente o realizar alguna acción específica
    });

    await client.initialize().catch(err => {
        console.error(`Error al inicializar el cliente "${clientId}":`, err);
        // Aquí puedes manejar cualquier error que ocurra durante la inicialización del cliente
    });
}

async function initializeClients() {
    for (let i = 1; i <= MAX_CLIENTS; i++) {
        const clientId = `client-${i}`;
        await initializeClient(clientId);
    }
}

function generateNextQR() {
    currentClientIndex++; // Avanzar al siguiente cliente
    if (currentClientIndex >= clients.length) {
        currentClientIndex = 0; // Reiniciar al primer cliente si llegamos al final de la lista
    }

    const nextClient = clients[currentClientIndex];

    // Verificar si el siguiente cliente ha sido utilizado
    if (nextClient.used) {
        console.log(`Generando código QR para el siguiente cliente en uso: ${nextClient.session.name}`);
        nextClient.client.refreshQR(); // Generar código QR para el siguiente cliente en uso
    } else {
        console.log(`Esperando a que se utilice el cliente: ${nextClient.session.name}`);
    }
}

initializeClients(); // Inicializar clientes

app.get('/', (req, res) => {
    res.send('Servidor de WhatsApp activo.');
});

app.listen(port, () => {
    console.log(`Servidor Express escuchando en http://localhost:${port}`);
});
