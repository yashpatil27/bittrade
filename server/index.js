const DataService = require('./services/data-service');

// Start the data service
const dataService = new DataService();
global.dataService = dataService;

dataService.start().catch(console.error);
