import { app } from './app';
import { env } from './config/env';

app.listen(env.port, () => {
  console.log(`🏠 Welive Server listening on port ${env.port}`);
});
