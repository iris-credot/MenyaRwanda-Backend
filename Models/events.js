const mongoose = require('mongoose');

console.log('Loading Event Model...');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  location: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  capacity: {
    type: Number,
    default: null
  },
  price: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
console.log('Event Model created successfully:', typeof Event);
console.log('Event.create function:', typeof Event?.create);

module.exports = Event;