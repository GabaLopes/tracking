import net from 'net';

const PORT = 1883;
const server = net.createServer((socket) => {
  console.log('Novo dispositivo conectado:', socket.remoteAddress, socket.remotePort);

  socket.on('data', (data) => {
    console.log('Dados recebidos:', data.toString());
    
    // Aqui você pode processar os dados recebidos e salvar no banco
  });

  socket.on('end', () => {
    console.log('Dispositivo desconectado');
  });

  socket.on('error', (err) => {
    console.error('Erro no socket:', err);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor TCP rodando na porta ${PORT}`);
});