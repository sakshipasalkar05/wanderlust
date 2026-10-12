const Review = require("../models/review.js");
const Listing = require("../models/listing.js");


module.exports.createReview = async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    // Owners can't review their own listing
    if (listing.owner && listing.owner.equals(req.user._id)) {
        req.flash("error", "You can't review your own listing.");
        return res.redirect(`/listings/${listing._id}`);
    }

    // One review per user per listing
    const alreadyReviewed = await Review.exists({
        _id: { $in: listing.reviews },
        author: req.user._id,
    });
    if (alreadyReviewed) {
        req.flash("error", "You have already reviewed this listing.");
        return res.redirect(`/listings/${listing._id}`);
    }

    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();
    req.flash("success", "New review created!");
    return res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview =async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review deleted!");
    return res.redirect(`/listings/${id}`);
};