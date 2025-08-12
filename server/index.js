const DataService = require('./services/data-service');
const logger = require('./utils/logger');

// Start the data service
const dataService = new DataService();
global.dataService = dataService;

dataService.start().catch(err => logger.error('Failed to start data service', err, 'DATA'));
