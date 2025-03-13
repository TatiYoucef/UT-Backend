const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const filePath = './data/quiz.json';

// Load JSON data
const loadData = () => JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Save JSON data
const saveData = (data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

//Get all list of quizes
app.get('/api/quiz', (req, res) => {
  const data = loadData();

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify(data, null, 2)); // Pretty-print with 2 spaces
});

// Get list of the month
app.get('/api/quiz/:month', (req, res) => {
  const month = parseInt(req.params.month);
  const data = loadData();

  const monthData = data.find(m => m.month === month);
  if (!monthData) return res.status(404).send({ error: "Month not found" });

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify(monthData, null, 2));
});

// Get quiz for a specific month and day
app.get('/api/quiz/:month/:day', (req, res) => {
  const month = parseInt(req.params.month);
  const day = parseInt(req.params.day);
  const data = loadData();

  const monthData = data.find(m => m.month === month);
  if (!monthData) return res.status(404).send({ error: "Month not found" });

  const dayData = monthData.days.find(d => d.day === day);
  if (!dayData) return res.status(404).send({ error: "Day not found" });

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify(dayData, null, 2));
});

// Mark quiz as solved
app.get('/api/quiz/:month/:day/solve', (req, res) => {
  const month = parseInt(req.params.month);
  const day = parseInt(req.params.day);
  const data = loadData();

  const monthData = data.find(m => m.month === month);
  if (!monthData) return res.status(404).send({ error: "Month not found" });

  const dayData = monthData.days.find(d => d.day === day);
  if (!dayData) return res.status(404).send({ error: "Day not found" });

  dayData.solved = !dayData.solved ;
  saveData(data);

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify({ message: "Quiz marked as solved", dayData }, null, 2));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
