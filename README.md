# Wanderlust

Wanderlust is an Airbnb-inspired vacation rental web application built with Node.js, Express, MongoDB, and EJS. It allows users to browse listings, filter by category, add reviews, save favorites to a wishlist, and manage their own properties.

## Features

- Browse and search vacation homes and stay listings
- Filter listings by category and keyword search
- View detailed listing pages with reviews and average ratings
- Add, edit, and delete listings for authenticated users
- Save listings to a personal wishlist
- User signup/login flow with Passport.js
- Cloudinary-powered image upload for listing photos
- Flash notifications and session-based authentication
- Security protections including Helmet, rate limiting, and Mongo sanitization

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- EJS templating
- Passport.js for authentication
- Cloudinary for image storage
- Joi for validation
- Bootstrap-based UI styling

## Project Structure

```text
.
├── app.js                 # App entry point and server configuration
├── cloudConfig.js         # Cloudinary configuration
├── middleware.js          # Auth, validation, and custom middleware
├── schema.js              # Validation schemas
├── controllers/          # Request handlers for listings, reviews, and users
├── models/                # Mongoose schemas
├── routes/                # Express routes
├── utils/                 # Helper modules and error handling
├── public/                # Static CSS/JS assets
├── views/                 # EJS templates
├── init/                  # Seed data utilities
├── package.json           # Project scripts and dependencies
├── .env                   # Local environment variables (not committed)
└── README.md
```

## Prerequisites

Before running the project, make sure you have:

- Node.js installed
- MongoDB running locally or a MongoDB Atlas connection string
- A Cloudinary account for image uploads

## Installation

1. Clone the repository
2. Open the project directory
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file in the project root and add the following:

```env
SECRET=your_session_secret
CLOUD_NAME=your_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
ATLASDB_URL=mongodb+srv://username:password@cluster.mongodb.net/wanderlust
```

If you are using a local MongoDB instance without Atlas, the app is currently configured to connect to:

```text
mongodb://127.0.0.1:27017/wanderlust
```

You can update that connection string in `app.js` if needed.

## Running the App

Start the development server:

```bash
npm start
```

The application will run on:

```text
http://localhost:8080
```

## Available Scripts

```json
"scripts": {
  "start": "nodemon app.js"
}
```

## How the App Works

### Listings
Users can view all listings, search by location or title, and filter by category. Each listing includes a title, description, price, location, country, category, and image.

### Reviews
Users can leave ratings and comments for listings. Review data is associated with a listing and an author user.

### Wishlist
Authenticated users can save listings to a personal wishlist for quick access later.

### Authentication
The app uses Passport.js with local strategy authentication and stores session data with MongoDB.

## Security Notes

This project includes:

- Helmet for HTTP security headers
- Express rate limiting on auth and general routes
- Mongo sanitization to reduce query injection risk
- Session cookies with HTTP-only settings

## Environment Setup Tips

- Keep your `.env` file private and do not commit it to version control
- Use strong, random values for `SECRET`
- Ensure Cloudinary credentials are valid before uploading images
- For production, set `NODE_ENV=production` and review security settings

## License

This project is licensed under the ISC License.

## Author

Built as a full-stack Express project for a vacation rental marketplace experience.
