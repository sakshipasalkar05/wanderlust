const mongoose = require("mongoose");
const Listing = require("../models/listing.js");

// First matching rule wins; anything unmatched becomes "Trending"
const rules = [
  [/castle/i, "Castles"],
  [/pool|villa|bungalow|island|beach/i, "Amazing Pools"],
  [/cabin|treehouse|lodge|chalet|cottage/i, "Camping"],
  [/loft|penthouse|apartment|brownstone|canal|house/i, "Iconic Cities"],
];

async function run() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
  const listings = await Listing.find({ category: null }); // matches missing category
  for (let l of listings) {
    const rule = rules.find(([re]) => re.test(l.title));
    await Listing.updateOne({ _id: l._id }, { category: rule ? rule[1] : "Trending" });
  }
  console.log(`Updated ${listings.length} listings`);
  await mongoose.connection.close();
}

run();