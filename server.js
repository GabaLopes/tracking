const net = require('net');
const amqp = require('amqplib');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const RABBITMQ_URL = 'amqp://localhost';
const QUEUE_NAME = 'tracking_queue';
const PORT = 1883;

const client = new SecretManagerServiceClient();
const secretName = 'projects/696608906423/secrets/rabbitmq-credentials/versions/1';  // Substitua pelo seu ID do projeto e o nome do segredo

async function getRabbitMQCredentials() {
  try {
    const [version] = await client.accessSecretVersion({ name: secretName });
    const secretPayload = version.payload.data.toString();
    const [username, password] = secretPayload.split(':'); // Supondo que você tenha armazenado como "usuario:senha"
    return { username, password };
  } catch (err) {
    console.error('Erro ao acessar o Secret Manager:', err);
    throw err;
  }
}

// Conecta ao RabbitMQ
let channel;
async function connectRabbitMQ() {
  try {

    const { username, password } = await getRabbitMQCredentials();
    const RABBITMQ_URL_WITH_CREDENTIALS = `amqp://${username}:${password}@localhost`;  // Substitua 'localhost' com seu servidor RabbitMQ

    const connection = await amqp.connect(RABBITMQ_URL_WITH_CREDENTIALS);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log('Conectado ao RabbitMQ e fila criada');
  } catch (err) {
    console.error('Erro ao conectar ao RabbitMQ:', err);
  }
}

const server = net.createServer((socket) => {
  console.log('Novo dispositivo conectado:', socket.remoteAddress, socket.remotePort);

  socket.on('data', async (data) => {
    const message = data.toString().trim();
    console.log('📡 Dados recebidos:', message);

    // Publica a mensagem no RabbitMQ
    if (channel) {
      try {
        channel.sendToQueue(QUEUE_NAME, Buffer.from(message), { persistent: true });
        console.log('Mensagem enviada para o RabbitMQ:', message);
      } catch (err) {
        console.error('Erro ao enviar mensagem para o RabbitMQ:', err);
      }
    } else {
      console.error('Canal do RabbitMQ não está disponível');
    }
  });

  socket.on('end', () => {
    console.log('Dispositivo desconectado');
  });

  socket.on('error', (err) => {
    console.error('Erro no socket:', err);
  });
});

server.listen(PORT, async () => {
  console.log(`Servidor TCP rodando na porta ${PORT}`);
  await connectRabbitMQ(); 
});
