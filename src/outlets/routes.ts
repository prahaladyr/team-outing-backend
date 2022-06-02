import express from 'express';
import { DB_NAME, getDatabaseClient } from '../db-utls';
import bcrypt from 'bcrypt';
import asyncHandler from 'express-async-handler';
import { generateJWT } from '../auth/auth';
import passport from 'passport';

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

outletRoutes.get('/', jwtAuthentication,async (request, response) => {
    const outletCollections = getDatabaseClient().db(DB_NAME).collection('outlets');
    const allOutlets = await outletCollections.find().toArray();

    response.status(200);
    response.json(allOutlets);
})

export default outletRoutes;