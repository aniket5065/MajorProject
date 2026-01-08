// controllers/listings.js

const Listing = require('../models/listing.js');

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
};

module.exports.createListings = async (req, res) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    // If user uploaded an image
    if (req.file) {
        newListing.image = {
            url: `/uploads/${req.file.filename}`,
            filename: req.file.filename
        };
    }
    // Else: image will use default from schema.js (Unsplash goat image)

    await newListing.save();
    req.flash("success", "New Listing Created Successfully!");
    res.redirect("/listings");
};

module.exports.editListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }

    // For preview in edit form (optional thumbnail - not needed for local)
    // We just pass the current image url as is
    res.render("listings/edit.ejs", { 
        listing, 
        originalImageUrl: listing.image.url 
    });
};

module.exports.updateListings = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    // If a new image was uploaded during edit
    if (req.file) {
        listing.image = {
            url: `/uploads/${req.file.filename}`,
            filename: req.file.filename
        };
        await listing.save();
    }

    req.flash("success", "Listing Updated Successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListings = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted Successfully!");
    res.redirect("/listings");
};