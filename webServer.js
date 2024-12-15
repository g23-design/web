const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const User = require('./schema/user.js');
const Photo = require('./schema/photo.js');
const SchemaInfo = require('./schema/schemaInfo.js');

const app = express();
mongoose.Promise = require('bluebird');
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1/cs142project6', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Middleware
app.use(express.static(__dirname));  // Serve static files (ensure 'uploads' directory exists)
app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: false
}));
app.use(bodyParser.json());  // Parse JSON requests
app.use(bodyParser.urlencoded({ extended: true }));  // Parse URL-encoded requests

// Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Specify upload directory
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname); // Get file extension
        const fileName = Date.now() + extension;  // Generate unique file name
        cb(null, fileName);
    }
});
const upload = multer({ storage: storage });

// Routes
app.post('/admin/login', function (request, response) {
    var loginName = request.body.login_name;
    var password = request.body.password;
    User.findOne({ login_name: loginName, password: password }, function (err, info) {
        if (err) {
            console.error('Error in /admin/login:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (!info) {
            console.log('Invalid login name or password.');
            response.status(400).send('Not found');
            return;
        }
        request.session.user_id = info._id;
        request.session.first_name = info.first_name;
        request.session.last_name = info.last_name;
        response.status(200).send({
            _id: info._id,
        });
    });
});

app.post('/admin/logout', function (request, response) {
    if (!request.session.user_id) {
        return response.status(400).send('User is not logged in.');
    }
    request.session.destroy(function (err) {
        console.log(err);
        response.status(200).send('Logout success.');
    });
});

// Fetch SchemaInfo or collection counts
app.get('/test/:p1', async (req, res) => {
    try {
        const param = req.params.p1 || 'info';
        if (param === 'info') {
            const info = await SchemaInfo.findOne({});
            if (!info) return res.status(404).send('SchemaInfo not found');
            return res.json(info);
        }
        if (param === 'counts') {
            const collections = [
                { name: 'user', collection: User },
                { name: 'photo', collection: Photo },
                { name: 'schemaInfo', collection: SchemaInfo },
            ];
            const counts = {};
            await Promise.all(
                collections.map(async (col) => {
                    counts[col.name] = await col.collection.countDocuments({});
                })
            );
            return res.json(counts);
        }
        res.status(400).send(`Invalid parameter: ${param}`);
    } catch (err) {
        res.status(500).send({ error: 'Server error', details: err.message });
    }
});

// Fetch all users with photo and comment counts
app.get('/user/list', async (req, res) => {
    try {
        const users = await User.find({});
        const userList = await Promise.all(
            users.map(async (user) => {
                const photoCount = await Photo.countDocuments({ user_id: user._id });
                const commentCount = await Photo.aggregate([
                    { $match: { user_id: user._id } },
                    { $unwind: '$comments' },
                    { $group: { _id: null, count: { $sum: 1 } } }
                ]);
                return {
                    first_name: user.first_name,
                    last_name: user.last_name,
                    _id: user._id,
                    photoCount: photoCount,
                    commentCount: commentCount[0] ? commentCount[0].count : 0
                };
            })
        );
        res.json(userList);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch user list', details: err.message });
    }
});

// Fetch user by ID
app.get('/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send('Invalid User ID');
        const user = await User.findById(id).lean();
        if (!user) return res.status(404).send('User not found');
        delete user.__v;
        res.json(user);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch user', details: err.message });
    }
});

// Fetch photos of a user by ID
app.get('/photosOfUser/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send('Invalid User ID');
        const photos = await Photo.find({ user_id: id }).lean();
        if (!photos.length) return res.status(404).send('No photos found for this user');
        await Promise.all(
            photos.map(async (photo) => {
                await Promise.all(
                    photo.comments.map(async (comment) => {
                        const user = await User.findById(comment.user_id).lean();
                        if (user) {
                            comment.user = {
                                _id: user._id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                            };
                            delete comment.user_id;
                        }
                    })
                );
            })
        );
        res.json(photos);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch photos', details: err.message });
    }
});

// Fetch comments of a user by ID
app.get('/commentsOfUser/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send('Invalid User ID');
        const photos = await Photo.find({ user_id: id }).lean();
        const comments = [];
        photos.forEach(photo => {
            photo.comments.forEach(comment => {
                comments.push({
                    photoId: photo._id,
                    text: comment.text,
                    date: comment.date,
                    user: comment.user
                });
            });
        });
        if (!comments.length) return res.status(404).send('No comments found for this user');
        res.json(comments);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch comments', details: err.message });
    }
});

// Fetch detailed view of a photo and its comments
app.get('/photoDetail/:photoId', async (req, res) => {
    try {
        const { photoId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(photoId)) return res.status(400).send('Invalid Photo ID');
        const photo = await Photo.findById(photoId).lean();
        if (!photo) return res.status(404).send('Photo not found');
        await Promise.all(
            photo.comments.map(async (comment) => {
                const user = await User.findById(comment.user_id).lean();
                if (user) {
                    comment.user = {
                        _id: user._id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                    };
                    delete comment.user_id;
                }
            })
        );
        res.json(photo);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch photo details', details: err.message });
    }
});

// File upload route
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }
    res.json({ message: 'File uploaded successfully!', file: req.file });
});

// Admin Status Route
app.get('/admin/status', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Global 404 handler for routes not found
app.use((req, res) => {
    console.log(`Route not found: ${req.originalUrl}`);
    res.status(404).send('Route not found');
});

// Start the server
var server = app.listen(3000, () => {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});
