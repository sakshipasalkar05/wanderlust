const Listing = require("../models/listing");
const { cloudinary } = require("../cloudConfig.js");
const categories = require("../utils/categories.js");
const LISTINGS_PER_PAGE = 12;
const User = require("../models/user.js");
const geocode = require("../utils/geocode.js");

const deleteCloudImage = async (filename) => {
  // Skip seed/default images, they aren't stored on Cloudinary
  if (filename && filename !== "listingimage") {
    try {
      await cloudinary.uploader.destroy(filename);
    } catch (e) {
      console.log("Cloudinary delete failed:", e.message);
    }
  }
};

module.exports.index = async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const category = categories.includes(req.query.category) ? req.query.category : "";

    let filter = {};
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safe, "i");
      filter.$or = [{ title: regex }, { location: regex }, { country: regex }];
    }
    if (category) {
      filter.category = category;
    }

    const totalListings = await Listing.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalListings / LISTINGS_PER_PAGE));

    let page = parseInt(req.query.page, 10);
    if (!Number.isInteger(page) || page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const allListings = await Listing.find(filter)
      .sort({ _id: -1 }) // newest first; a stable order is needed for paging
      .skip((page - 1) * LISTINGS_PER_PAGE)
      .limit(LISTINGS_PER_PAGE);

    res.locals.searchQuery = q;
    res.locals.activeCategory = category;
    res.render("listings/index.ejs", { allListings, page, totalPages });
};


module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};


module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate( {path: "reviews", populate: {path: "author",}})
      .populate("owner");
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }

    const total = listing.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avgRating = listing.reviews.length ? total / listing.reviews.length : 0;

    res.render("listings/show.ejs", { listing, avgRating });
};


module.exports.createListing = async (req, res, next) => {
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  if (req.file) {
    newListing.image = { url: req.file.path, filename: req.file.filename };
  } else {
    newListing.image = {
      url: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=800&q=60",
      filename: "listingimage",
    };
  }

  // Turn "location, country" into coordinates for the map
  const geometry = await geocode(`${newListing.location}, ${newListing.country}`);
  if (geometry) {
    newListing.geometry = geometry;
  }

  await newListing.save();
  req.flash(
    "success",
    geometry
      ? "New listing created!"
      : "New listing created, but we couldn't find its location on the map."
  );
  res.redirect("/listings");
};


module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250")
    res.render("listings/edit.ejs", { listing ,originalImageUrl});
};


module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    // findByIdAndUpdate returns the document as it was BEFORE the update,
    // which lets us compare the old place with the new one
    let listing = await Listing.findByIdAndUpdate(id, {
      ...req.body.listing,
    });

    let needsSave = false;

    if (typeof req.file !== "undefined") {
      await deleteCloudImage(listing.image?.filename);
      listing.image = { url: req.file.path, filename: req.file.filename };
      needsSave = true;
    }

    // Re-geocode if the place changed, or if this listing has no coordinates yet
    const { location, country } = req.body.listing;
    const placeChanged = location !== listing.location || country !== listing.country;
    const hasGeometry =
      listing.geometry &&
      listing.geometry.coordinates &&
      listing.geometry.coordinates.length === 2;

    if (placeChanged || !hasGeometry) {
      const geometry = await geocode(`${location}, ${country}`);
      if (geometry) {
        listing.geometry = geometry;
        needsSave = true;
      } else if (placeChanged) {
        // Don't keep a pin for the old place if the new one can't be found
        await Listing.updateOne({ _id: id }, { $unset: { geometry: "" } });
      }
    }

    if (needsSave) {
      await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};


module.exports.destroyListing =async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    if (deletedListing) {
      await deleteCloudImage(deletedListing.image?.filename);
    }   
    req.flash("success", "Listing deleted");
    res.redirect("/listings");
};

module.exports.toggleWishlist = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }

    const alreadySaved = req.user.wishlist.some((w) => w.equals(listing._id));
    await User.findByIdAndUpdate(
      req.user._id,
      alreadySaved
        ? { $pull: { wishlist: listing._id } }
        : { $addToSet: { wishlist: listing._id } }
    );

    req.flash("success", alreadySaved ? "Removed from your wishlist" : "Saved to your wishlist");

    // If the request came from the wishlist page, go back there
    if (req.body.from === "wishlist") {
        return res.redirect("/wishlist");
    }
    res.redirect(`/listings/${id}`);
};