import { Express } from './express';

/**
 * Main class for the app. Used to initialize and start the Express server
 */
class Main {
  /**
   * Initialize call the main function. Catch any error and log it
   */
  constructor() {
    this.main().catch((error) => console.log(error));
  }

  /**
   * Initialize express server
   */
  private async main() {
    const express = new Express();
    await express.init();
    await express.listen(process.env.PORT);

    console.log('Server is running at PORT: %s', process.env.PORT);
  }
}

/**
 * Create a new instance
 */
new Main();
