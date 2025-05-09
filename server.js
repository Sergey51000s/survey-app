const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/submit', async (req, res) => {
  try {
    console.log('Получены данные:', req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Ошибка:', error);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});