const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
  extended: false
}));

console.log(process.env.PORT, process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })


const userSchema = new mongoose.Schema({
  username: String,
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    const newUser = new User({ username });
    await newUser.save();
    res.json({ username: newUser.username, _id: newUser._id });
  } catch (err) {
    res.status(400).send('Error creating user');
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const userId = req.params._id;
    const newExercise = new Exercise({
      userId,
      description,
      duration,
      date: date ? new Date(date) : new Date(),
    });
    await newExercise.save();
    const user = await User.findById(userId);
    // user.log.push(newExercise);
    // await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date.toDateString(), // Convert date to string
    });
  } catch (err) {
    res.status(400).send('Error adding exercise');
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const userId = req.params._id;
    // console.log(userId);
    const user = await User.findById(userId);
    let logs = await Exercise.find({userId:user._id}, {_id:0, userId:0});
    // console.log(user, logs);
    // let logs = user.log.map(exercise => ({
    //   description: exercise.description,
    //   duration: exercise.duration,
    //   date: exercise.date.toDateString(), // Convert date to string
    // }));
    
    // Filtering based on from, to, and limit parameters
    let { from, to, limit } = req.query;
    if (from) logs = logs.filter(exercise => exercise.date >= new Date(from));
    if (to) logs = logs.filter(exercise => exercise.date <= new Date(to));
    if (limit) logs = logs.slice(0, Number(limit));

    logs = logs.map(log => ({
      description: log.description,
      duration: log.duration,
      date: log.date.toDateString()
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: logs.length,
      log: logs,
    });
  } catch (err) {
    res.status(400).send('Error fetching exercise logs');
  }
})

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(400).send('Error fetching users');
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
