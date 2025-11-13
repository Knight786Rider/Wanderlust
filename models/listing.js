const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const dateRangeSchema = new Schema({
  start: { type: Date, required: true },
  end: { type: Date, required: true }
}, { _id: false });

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  category: {
    type: String,
    enum: [
      "Farms",
      "Rooms",
      "Amazing Views",
      "Iconic Cities",
      "Surfing",
      "Amazing Pools",
      "Beach",
      "Cabins",
      "OMG!",
      "Lakefront",
    ],
    default: "Rooms",
  },
  image: {
    filename: {
      type: String,
      default: "listingimage",
    },
    url: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
  },
  price: Number,
  location: String,
  country: String,
  // NEW: number of guests the listing supports
  guests: {
    type: Number,
    default: 1,
    min: 1,
  },
  // NEW: availability as array of date ranges
  availableDates: {
    type: [dateRangeSchema],
    default: [] // you can seed this in your init data if you want
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  geometry: {
  type: {
    type: String,
    enum: ['Point'],
    required: false
  },
  coordinates: {
    type: [Number],
    required: false
  }
}

});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
