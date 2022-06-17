import express from 'express';
import { DB_NAME, getDatabaseClient } from '../db-utls';
import bcrypt from 'bcrypt';
import asyncHandler from 'express-async-handler';
import sendGridMail, { MailDataRequired } from '@sendgrid/mail';
import { generateJWT } from './auth';
import { ObjectId } from 'mongodb';

const authRoutes = express.Router();
const SALT_ROUNDS = 12;

authRoutes.post('/signup/', asyncHandler(async (request, response) => {
    const name: string = request.body.name;
    const email: string = request.body.email;
    const password: string = request.body.password;
    const isAdmin: boolean = false;
    const logo: string = request.body.logo;
    const userCollection = getDatabaseClient().db(DB_NAME).collection('users');

    // Check if form is filled
    if (!name || !email || !password) {
        response.status(400);
        response.send("Please fill the required fields");
        return;
    }

    try {
        const userWithSameMail = await userCollection.find({
            email,
        }).count();

        if (userWithSameMail > 0) {
            response.status(400);
            response.send('EmailID already exists');
            return;
        }
    } catch {
        return;
    }

    try {
        bcrypt.hash(password, SALT_ROUNDS, (error, hashedPassword) => {
            if (error) {
                throw error;
            }

            userCollection.insertOne({
                name,
                email,
                password: hashedPassword,
                logo
            });
        });

        response.send("Registeration Complete, Please verify your profile to proceed further");
    } catch {
        return;
    }

    return;

}));

authRoutes.post('/login/', async (request, response) => {
    const email: string = request.body.email;
    const password: string = request.body.password;

    if (!email || !password) {
        response.status(400);
        response.send("Please field the required fields");
        return;
    }

    const userCollection = getDatabaseClient().db(DB_NAME).collection('users');

    let users = await userCollection.find({
        email,
    }).toArray();

    const matchedUser = users[0];

    if (!matchedUser) {
        response.status(400);
        response.send('Wrong credentials');
        return;
    }

    let passwordComparisonResult: boolean;

    try {
        passwordComparisonResult = await bcrypt.compare(password, matchedUser.password);

        if (passwordComparisonResult) {
            response.send({
                id: matchedUser._id,
                token: generateJWT(matchedUser._id),
            });
        } else {
            response.status(400);
            response.send('Wrong credentials');
        }

    } catch (e) {
        response.sendStatus(500);
        response.json(e);
    }

    return;
});

authRoutes.get('/getUserInfo', asyncHandler(async (request, response) => {
    const _id: string = request.body.id;
    const userCollection = getDatabaseClient().db(DB_NAME).collection('users');

    if (!_id) {
        response.status(400);
        response.send("User ID Required");
        return;
    }

    let users = await userCollection.find(
        { _id: new ObjectId(_id) }
    ).toArray();

    let matchedUser = users[0];

    if(!matchedUser){
        response.status(400);
        response.send("Unable to get User");
        return;
    }

    response.status(200);
    response.send({
        name: matchedUser.name,
        email: matchedUser.email,
        id: matchedUser._id
    });
}));

export default authRoutes;