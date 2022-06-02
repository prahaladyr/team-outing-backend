import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { connectToDatabaseServer } from './db-utls';
import authRoutes from './auth/routes';
import outletRoutes from './outlets/routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.set('port', process.env.PORT || 8001);
app.use('/auth/', authRoutes);
app.use('/outlets/', outletRoutes);

app.get('/', (request, response) => {
    response.send('Server running' + app.get('port'));
});

const server = app.listen(app.get('port'), () => {
    connectToDatabaseServer();
    console.log('Team Outing App is running on http://localhost:%d', app.get('port'));
});