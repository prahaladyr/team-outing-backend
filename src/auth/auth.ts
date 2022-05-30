import passport from 'passport';
import passportJWT, { StrategyOptions } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import { getDatabaseClient, DB_NAME } from '../db-utls';
import { ObjectId } from 'bson';

const DEFAULT_SECRET = process.env.SECRET_KEY || '02faf720-e46c-4af8-b4f8-8cdc8ba1aaf5';
export const SALT_ROUNDS = 12;

const JwtStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;
const strategyOptions: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token')
    ]),
    secretOrKey: DEFAULT_SECRET,
};

passport.use(new JwtStrategy(strategyOptions, async (jwtPayload, done) => {
    const usersCollection = getDatabaseClient().db(DB_NAME).collection('users');
    try {
        const user = await usersCollection.findOne({
            _id: new ObjectId(jwtPayload.sub)
        });

        if (user && !user.archived) {
            return done(null, user);
        } else {
            return done(null, false);
        }

    } catch (error) {
        return done(error, false);
    }
}));

export function generateJWT(id: string | any) {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);
    expirationDate.setHours(0);
    expirationDate.setMinutes(0);
    expirationDate.setSeconds(0);
    expirationDate.setMilliseconds(0);

    const signedToken = jwt.sign({
        sub: id,
        exp: expirationDate.getTime() / 1000,
    }, DEFAULT_SECRET);

    return signedToken;
}