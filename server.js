const express = require('express');
const fs = require('fs');
const cors = require('cors');


const app = express();
app.use(express.json());
app.use(cors());

const filePath = './data/quiz.json';
const leakedPath = './data/leaked.json';
const achievementsPath = './data/achievements.json';

// Load JSON data
const loadData = () => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const loadLeakedData = () => JSON.parse(fs.readFileSync(leakedPath, 'utf8'));
const loadachievementsData = () => JSON.parse(fs.readFileSync(achievementsPath, 'utf8'));

// Save JSON data
const saveData = (data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
const saveAchievementsData = (data) => fs.writeFileSync(achievementsPath, JSON.stringify(data, null, 2), 'utf8');

// get date on Algeria
const getCurrentDate = () => {
  const now = new Date();
  const options = { timeZone: 'Africa/Algiers', year: 'numeric', month: '2-digit', day: '2-digit'};
  return now.toLocaleDateString('en-CA', options);
};
app.get('/api/date', (req, res) => {
  res.send({ date: getCurrentDate() });
});

// Get leaked data
app.get('/api/leaked', (req, res) => {
  const data = loadLeakedData();

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify(data, null, 2)); // Pretty-print with 2 spaces
});

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
app.get('/api/quiz/:month/:day/solve/:year', (req, res) => {
  const month = parseInt(req.params.month);
  const day = parseInt(req.params.day);
  const year = parseInt(req.params.year);
  const data = loadData();

  const monthData = data.find(m => m.month === month);
  if (!monthData) return res.status(404).send({ error: "Month not found" });

  const dayData = monthData.days.find(d => d.day === day);
  if (!dayData) return res.status(404).send({ error: "Day not found" });

  if(!dayData.solved) {
    achieveData = loadachievementsData();
    achieveData.nbrSolved++; // Increment the number of solved quizzes
    saveAchievementsData(achieveData);
  }

  dayData.solved = true ;
  dayData.sYear = year; //which year was solved

  if(monthData.solvedOne === false) {
    monthData.solvedOne = true; // Mark the month as solved if it's the first solved day
  }

  saveData(data);

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify({ message: "Quiz marked as solved", dayData }, null, 2));
});

// Mark quiz as not solved
app.get('/api/quiz/:month/:day/unsolve', (req, res) => {
  const month = parseInt(req.params.month);
  const day = parseInt(req.params.day);
  const data = loadData();

  const monthData = data.find(m => m.month === month);
  if (!monthData) return res.status(404).send({ error: "Month not found" });

  const dayData = monthData.days.find(d => d.day === day);
  if (!dayData) return res.status(404).send({ error: "Day not found" });

  dayData.solved = false ;
  dayData.sYear = 0; // Reset the year when unsolved

  //find the month and check if it has any solved days left
  const hasSolvedDays = monthData.days.some(d => d.solved);
  if (!hasSolvedDays) {
    monthData.solvedOne = false; // Mark the month as not solved if no days are solved
  }


  saveData(data);

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify({ message: "Quiz marked as unsolved", dayData }, null, 2));
});

// Get achievements
app.get('/api/achievements', (req, res) => {
  const data = loadachievementsData();

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify(data, null, 2)); // Pretty-print with 2 spaces
});

// set nbr of solved quizzes
app.get('/api/achievements/nbrSolved/:nbr', (req, res) => {
  const nbr = parseInt(req.params.nbr);
  const data = loadachievementsData();

  if (isNaN(nbr) || nbr < 0) {
    return res.status(400).send({ error: "Invalid number of solved quizzes" });
  }

  data.nbrSolved = nbr;
  saveAchievementsData(data);

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify({ message: "Number of solved quizzes updated", nbrSolved: nbr }, null, 2));
});

// set current streak
app.get('/api/achievements/streak/:nbr', (req, res) => {
  const nbr = parseInt(req.params.nbr);
  const data = loadachievementsData();

  if (isNaN(nbr) || nbr < 0) {
    return res.status(400).send({ error: "Invalid number of Streaks" });
  }

  data.Streak = nbr;
  if(nbr > data.BestStreak) data.BestStreak = nbr; // Update BestStreak if current streak is greater
  if(nbr === 0) data.BrokenStreak = true; // If current streak is 0, mark as broken streak

  saveAchievementsData(data);

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify({ message: "Current Streak updated", nbrSolved: nbr }, null, 2));
});

// set best streak
app.get('/api/achievements/bestStreak/:nbr', (req, res) => {
  const nbr = parseInt(req.params.nbr);
  const data = loadachievementsData();

  if (isNaN(nbr) || nbr < 0) {
    return res.status(400).send({ error: "Invalid number of Streaks" });
  }

  data.BestStreak = nbr;
  saveAchievementsData(data);

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify({ message: "Best Streak updated", nbrSolved: nbr }, null, 2));
});

// set nbr of failures
app.get('/api/achievements/nbrFails/:nbr', (req, res) => {
  const nbr = parseInt(req.params.nbr);
  const data = loadachievementsData();

  if (isNaN(nbr) || nbr < 0) {
    return res.status(400).send({ error: "Invalid number of Fails" });
  }

  data.nbrFailures = nbr;
  saveAchievementsData(data);

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify({ message: "Fails updated", nbrSolved: nbr }, null, 2));
});

// set broken streak
app.get('/api/achievements/brokenStreak/:status', (req, res) => {
  const status = req.params.status === 'true';
  const data = loadachievementsData();

  data.BrokenStreak = status;
  saveAchievementsData(data);

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify({ message: "Broken Streak updated", BrokenStreak: status }, null, 2));
});

// set early bird status
app.get('/api/achievements/earlyBird/:status', (req, res) => {
  const status = req.params.status === 'true';
  const data = loadachievementsData();

  data.EarlyBird = status;
  saveAchievementsData(data);

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify({ message: "EarlyBird updated", EarlyBird: status }, null, 2));
});

// set night owl status
app.get('/api/achievements/nightOwl/:status', (req, res) => {
  const status = req.params.status === 'true';
  const data = loadachievementsData();

  data.NightOwl = status;
  saveAchievementsData(data);

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify({ message: "NightOwl updated", NightOwl: status }, null, 2));
});

// set lostFragment fragment status
app.get('/api/achievements/lostFragment/:status', (req, res) => {
  const status = req.params.status === 'true';
  const data = loadachievementsData();

  data.lostFragment = status;
  saveAchievementsData(data);

  res.setHeader('Content-Type', 'application/json');  // Ensure JSON type
  res.send(JSON.stringify({ message: "Broken Fragment updated", BrokenFragment: status }, null, 2));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));