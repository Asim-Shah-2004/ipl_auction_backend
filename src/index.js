import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from 'morgan';
import 'express-async-errors';
import dotenv from 'dotenv';

import { dbConnect } from './db';

dotenv.config();
const port = process.env.PORT ?? 5000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(logger('dev'));

async function bootstrap() {
  try {
    await dbConnect(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(
        '\x1b[1m',
        '\x1b[37m',
        '\x1b[42m',
        `Server is Listening on Port ${port}...`,
        '\x1b[0m',
      ),
    );
  } catch (error) {
    console.log(
      '\x1b[1m',
      '\x1b[41m',
      '\x1b[37m',
      'Server could not Start...',
      '\x1b[0m',
    );
    console.log(error);
  }
}

void bootstrap();
