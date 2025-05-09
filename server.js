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

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const app = express();

app.use(cors());
app.use(express.json());

// Инициализация Firebase Admin (убедись, что credentials настроены)
const serviceAccount = require('./c:\Users\taras\survey-app\survey-app-e4682-firebase-adminsdk-fbsvc-ba3676190b.json'); // Замени на свой путь
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

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
  try {
    const surveysRef = db.collection('surveys');
    const snapshot = await surveysRef.get();

    if (snapshot.empty) {
      return res.json([]); // Пустой массив, если нет данных
    }

    const stats = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const dish = data.dish || 'Неизвестное блюдо';

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
      stats[dish].cookingQuality.push(Number(data.cookingQuality) || 0);
      stats[dish].ingredientQuality.push(Number(data.ingredientQuality) || 0);
      stats[dish].presentation.push(Number(data.presentation) || 0);
      stats[dish].servingTime.push(Number(data.servingTime) || 0);
      stats[dish].servingTemperature.push(Number(data.servingTemperature) || 0);
      stats[dish].menuMatch[data.menuMatch === 'Да' ? 'yes' : 'no'] += 1;
      stats[dish].priceQuality[
        data.priceQuality === 'Цена завышена' ? 'overpriced' :
        data.priceQuality === 'Цена занижена' ? 'underpriced' : 'fair'
      ] += 1;
      if (data.comment) stats[dish].comments.push(data.comment);
    });

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
    console.error('Error fetching stats:', error.message);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});