require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const mbxClient = require("@mapbox/mapbox-sdk");
const geocodingService = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;
const geocoder = geocodingService({ accessToken: mapToken });

async function fixOne() {
  await mongoose.connect(process.env.ATLASDB_URL);
  console.log("Connected!");

  const id = "691380bcd1ffc4825eb6686f"; // <-- your listing ID

  const listing = await Listing.findById(id);
  console.log("Listing:", listing.title);
  console.log("Old geometry:", listing.geometry);

  const geoRes = await geocoder.forwardGeocode({
    query: listing.location,
    limit: 1
  }).send();

  listing.geometry = geoRes.body.features[0].geometry;

  await listing.save();

  console.log("Updated geometry:", listing.geometry);
  process.exit();
}

fixOne();
