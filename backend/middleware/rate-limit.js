import rateLimit from 'express-rate-limit';
import app from '../app';

const limiter = rateLimit({ 
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: "Nombre de tentatives dépassé, veuillez réessayer ultérieurement"
});

app.use('/api/auth/login', limiter);