// One-time script: adds map coordinates to listings that don't have any.
// Run from the AIRBNB folder:  node init/addGeometry.js
const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const geocode = require("../utils/geocode.js");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");

  // Listings with fewer than two coordinates (missing or empty)
  const listings = await Listing.find({ "geometry.coordinates.1": { $exists: false } });
  console.log(`Found ${listings.length} listing(s) without coordinates`);

  let done = 0;
  const failed = [];

  for (const l of listings) {
    // Try the full place first, then just the location
    let geometry = await geocode(`${l.location}, ${l.country}`);
    await sleep(1100); // Nominatim allows about 1 request per second
    if (!geometry) {
      geometry = await geocode(l.location);
      await sleep(1100);
    }

    if (geometry) {
      await Listing.updateOne({ _id: l._id }, { geometry });
      done++;
      console.log(`OK     ${l.title} -> ${geometry.coordinates}`);
    } else {
      failed.push(l.title);
      console.log(`FAILED ${l.title} (${l.location}, ${l.country})`);
    }
  }

  console.log(`\nDone. Updated ${done}, failed ${failed.length}.`);
  if (failed.length) console.log("Failed:", failed.join(" | "));
  await mongoose.connection.close();
}

run();