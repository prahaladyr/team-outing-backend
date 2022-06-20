import express from "express";
import { DB_NAME, getDatabaseClient } from '../db-utls';
import bcrypt from 'bcrypt';
import asyncHandler from 'express-async-handler';
import passport from "passport";

export const jwtAuthentication = passport.authenticate('jwt', { session: false });

const adminRoutes = express.Router();
const SALT_ROUNDS = 12;

adminRoutes.post('/register', asyncHandler(async (request, response) => {
    const name: string = request.body.name;
    const password: string = request.body.password;
    const email: string = request.body.email;

    if (!name || !password || !email) {
        response.status(400);
        response.send("All fields are required")
        return;
    }

    const adminCollection = getDatabaseClient().db(DB_NAME).collection('admin');

    try {
        const userWithSameMail = await adminCollection.find({
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

            adminCollection.insertOne({
                name,
                email,
                password: hashedPassword,
            });
        });

        response.send("You are an Admin now");
    } catch {
        return;
    }
    return;
}));

adminRoutes.put('/updateAdmin', asyncHandler(async (request, response) => {
    const name: string = request.body.name;
    const password: string = request.body.password;
    const email: string = request.body.email;

    const newName: string = request.body.newName;
    const newPassword: string = request.body.newPassword;

    if (!name || !password || !email || !newName || !newPassword) {
        response.status(400);
        response.send("All fields are required")
        return;
    }

    const adminCollection = getDatabaseClient().db(DB_NAME).collection('admin');
    const userWithSameMail = await adminCollection.find({
        name,
        email,
    }).count();

    console.log(userWithSameMail)

    return;
}));

adminRoutes.post('/login', asyncHandler(async (request, response) => {
    const name: string = request.body.name;
    const password: string = request.body.password;

    if (!name || !password) {
        response.status(400);
        response.send("All fields are required")
        return;
    }

    const adminCollection = getDatabaseClient().db(DB_NAME).collection('admin');
    const userCollection = getDatabaseClient().db(DB_NAME).collection('users');
    const outletCollections = getDatabaseClient().db(DB_NAME).collection('outlets');
    const selectedOutletsCollections = getDatabaseClient().db(DB_NAME).collection('selectedOutlets');

    const userInfo = await  userCollection.find().toArray();
    const outletInfo = await outletCollections.find().toArray();
    const userSelectedOutlets = await selectedOutletsCollections.find().toArray();

    let users = await adminCollection.find({
        name,
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
                userInfo,
                outletInfo,
                userSelectedOutlets,
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
}));

adminRoutes.get('/getAllAdminInfo', asyncHandler(async (request, response) =>{
    const adminCollection = getDatabaseClient().db(DB_NAME).collection('admin');
    const allAdmins = await adminCollection.find().toArray();

    response.status(200);
    response.json(allAdmins);
}));

export default adminRoutes;