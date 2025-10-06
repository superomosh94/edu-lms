const express = require('express');
const router = express.Router();

router.get('/about', (req, res) => {
  res.render('about', { title: 'About EDU LMS' });
});

router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us' });
});

router.get('/schedule', (req, res) => {
  res.render('schedule', { title: 'Schedule' });
});

module.exports = router;


