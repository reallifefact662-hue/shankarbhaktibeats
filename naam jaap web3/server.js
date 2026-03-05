const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// simple in-memory store (replace with DB for production)
let store = {
  count: 0,
  name: 'ॐ नमः शिवाय',
  speed: 1.0,
  mala: 0
};

app.post('/api/tap', (req, res) => {
  store.count += 1;
  res.json({ count: store.count });
});

app.post('/api/reset', (req, res) => {
  store.count = 0;
  res.json({ count: store.count });
});

app.post('/api/setName', (req, res) => {
  const { name } = req.body || {};
  if (typeof name === 'string') store.name = name;
  res.json({ name: store.name });
});

app.post('/api/setSpeed', (req, res) => {
  const { speed } = req.body || {};
  store.speed = Number(speed) || store.speed;
  res.json({ speed: store.speed });
});

app.post('/api/updateMala', (req, res) => {
  const { mala } = req.body || {};
  store.mala = Number(mala) || store.mala;
  res.json({ mala: store.mala });
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));