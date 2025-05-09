const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Инициализация Firebase с переменной окружения
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_CONTENT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/submit', async (req, res) => {
  try {
    const {
      dish,
      cookingQuality,
      ingredientQuality,
      presentation,
      servingTime,
      servingTemperature,
      menuMatch,
      priceQuality,
      comment
    } = req.body;

    await db.collection('surveys').add({
      dish,
      cookingQuality: parseInt(cookingQuality),
      ingredientQuality: parseInt(ingredientQuality),
      presentation: parseInt(presentation),
      servingTime: parseInt(servingTime),
      servingTemperature: parseInt(servingTemperature),
      menuMatch,
      priceQuality,
      comment,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).send('Survey submitted');
  } catch (error) {
    console.error('Error submitting survey:', error);
    res.status(500).send('Error submitting survey');
  }
});

app.get('/api/stats', async (req, res) => {
  const password = req.headers.authorization;
  if (password !== 'your_secure_password') {
    return res.status(401).send('Unauthorized');
  }

  try {
    const snapshot = await db.collection('surveys').get();
    const stats = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!stats[data.dish]) {
        stats[data.dish] = { qualitySum: 0, count: 0, comments: [] };
      }
      stats[data.dish].qualitySum += parseInt(data.quality) || 0;
      stats[data.dish].count += 1;
      if (data.comment) stats[data.dish].comments.push(data.comment);
    });

    const result = Object.keys(stats).map(dish => ({
      dish,
      avgQuality: stats[dish].qualitySum / stats[dish].count,
      comments: stats[dish].comments
    }));

    res.json(result);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});