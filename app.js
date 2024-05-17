const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files from the 'assets' folder
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve HTML file with form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home-one.html'));
});

// Handle form submission
app.post('/send-email', (req, res) => {
    const { firstName, lastName, email, message } = req.body;

    // Setup OAuth2 Client
    const oAuth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );

    oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

    // Function to send email using Nodemailer with OAuth2
    async function sendMail() {
        try {
            const accessToken = await oAuth2Client.getAccessToken();

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: process.env.EMAIL_USER,
                    clientId: process.env.CLIENT_ID,
                    clientSecret: process.env.CLIENT_SECRET,
                    refreshToken: process.env.REFRESH_TOKEN,
                    accessToken: accessToken,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_RECIPIENT, // Ganti dengan alamat email tujuan
                subject: 'New Contact Form Submission',
                text: `Name: ${firstName} ${lastName}\nEmail: ${email}\nMessage: ${message}`
            };

            const result = await transporter.sendMail(mailOptions);
            return result;
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Error sending email');
        }
    }

    // Panggil fungsi sendMail dan tangani responsnya
    sendMail()
        .then((result) => {
            console.log('Email sent:', result);
            res.send('Email sent successfully');
        })
        .catch((error) => {
            console.error('Error sending email:', error);
            res.status(500).send('Error sending email');
        });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
