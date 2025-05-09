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
app.get('/api/stats', async (req, res) => {
  try {
    const surveysRef = db.collection('surveys');
    const snapshot = await surveysRef.get();
    const stats = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const dish = data.dish;

      if (!stats[dish]) {
        stats[dish] = {
          count: 0,
          cookingQuality: [],
          ingredientQuality: [],
          presentation: [],
          servingTime: [],
          servingTemperature: [],
          menuMatch: { yes: 0, no: 0 },
          priceQuality: { overpriced: 0, underpriced: 0, fair: 0 },
          comments: []
        };
      }

      stats[dish].count += 1;
      stats[dish].cookingQuality.push(data.cookingQuality);
      stats[dish].ingredientQuality.push(data.ingredientQuality);
      stats[dish].presentation.push(data.presentation);
      stats[dish].servingTime.push(data.servingTime);
      stats[dish].servingTemperature.push(data.servingTemperature);
      stats[dish].menuMatch[data.menuMatch === 'Да' ? 'yes' : 'no'] += 1;
      stats[dish].priceQuality[data.priceQuality === 'Цена завышена' ? 'overpriced' : data.priceQuality === 'Цена занижена' ? 'underpriced' : 'fair'] += 1;
      if (data.comment) stats[dish].comments.push(data.comment);
    });

    // Вычисляем средние значения
    const result = Object.keys(stats).map(dish => {
      const s = stats[dish];
      return {
        dish,
        count: s.count,
        avgCookingQuality: (s.cookingQuality.reduce((a, b) => a + b, 0) / s.count).toFixed(1),
        avgIngredientQuality: (s.ingredientQuality.reduce((a, b) => a + b, 0) / s.count).toFixed(1),
        avgPresentation: (s.presentation.reduce((a, b) => a + b, 0) / s.count).toFixed(1),
        avgServingTime: (s.servingTime.reduce((a, b) => a + b, 0) / s.count).toFixed(1),
        avgServingTemperature: (s.servingTemperature.reduce((a, b) => a + b, 0) / s.count).toFixed(1),
        menuMatch: s.menuMatch,
        priceQuality: s.priceQuality,
        comments: s.comments
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).send('Error fetching stats');
  }
});
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});