import express, { response } from 'express';
import { DB_NAME, getDatabaseClient } from '../db-utls';
import bcrypt from 'bcrypt';
import asyncHandler from 'express-async-handler';
import { generateJWT } from '../auth/auth';
import passport from 'passport';
import { request } from 'https';
import { ObjectId } from 'mongodb';

const outletRoutes = express.Router();
const SALT_ROUNDS = 12;

export const jwtAuthentication = passport.authenticate('jwt', { session: false });

outletRoutes.post('/add/', jwtAuthentication, async (request, response) => {
    const outletName: string = request.body.outletName;
    const outletType: string = request.body.outletType;
    const outletAddress: string = request.body.outletAddress;
    const outletLogo: string = request.body.outletLogo;

    const outletCollections = getDatabaseClient().db(DB_NAME).collection('outlets');

    if (!outletName || !outletType) {
        response.status(400);
        response.send("Please fill the required fields");
        return;
    }

    try {
        const outletWithSameName = await outletCollections.find({
            outletName,
        }).count();

        if (outletWithSameName > 0) {
            response.status(400);
            response.send('Outlet already exists');
            return;
        }

    } catch {
        return;
    }

    try {
        outletCollections.insertOne({
            outletName,
            outletAddress,
            outletLogo,
            outletType,
        });

        response.send("Outlet Added Duccessfully");
    } catch {
        return;
    }

    return;
});

outletRoutes.get('/', jwtAuthentication, async (request, response) => {
    const outletCollections = getDatabaseClient().db(DB_NAME).collection('outlets');
    const allOutlets = await outletCollections.find().toArray();

    response.status(200);
    response.json(allOutlets);
})

outletRoutes.post('/addUserOutlets/', jwtAuthentication, async (request, response) => {
    const userID = request.body.userID;
    const outletID = request.body.outletID;
    const isAnonymous = request.body.isAnonymous;

    if (!userID || !outletID) {
        response.status(400);
        response.send("Incomplete field type")
    }

    const userCollection = getDatabaseClient().db(DB_NAME).collection('users')
    const outletCollections = getDatabaseClient().db(DB_NAME).collection('outlets');
    const selectedOutletsCollections = getDatabaseClient().db(DB_NAME).collection('selectedOutlets');

    const currentUser = await userCollection.findOne({
        _id: new ObjectId(userID.toString()),
    });

    const currentOutlet = await outletCollections.findOne({
        _id: new ObjectId(outletID.toString()),
    });

    try {
        const submittedUser = await selectedOutletsCollections.find({
            userID,
        }).count();

        if (submittedUser > 0) {
            response.status(400);
            response.send('User already submitted the response');
            return;
        }
    } catch {
        return;
    }

    try {
        selectedOutletsCollections.insertOne({
            userName: isAnonymous ? 'Anonymous' : currentUser.name,
            userID,
            outletInfo: currentOutlet
        });
        response.send("User submitted response sucessfully");
    } catch (e) {
        response.sendStatus(500);
        response.json(e)
        response.send("Error Submitting Data");
        return;
    }

    return;
})

outletRoutes.get('/clearAllUserOutlets/', jwtAuthentication, async (request, response) => {
    const selectedOutletsCollections = getDatabaseClient().db(DB_NAME).collection('selectedOutlets');

    try {
        selectedOutletsCollections.deleteMany({});
        response.status(200);
        response.send("All Data Cleared Succussfully")
    } catch {
        return;
    }
    return;
})

outletRoutes.get('/userOutlets', jwtAuthentication, async (request, response) => {
    const selectedOutletsCollections = getDatabaseClient().db(DB_NAME).collection('selectedOutlets');
    const allOutlets = await selectedOutletsCollections.find().toArray()
    
    response.status(200);
    response.json(allOutlets);
})


export default outletRoutes;