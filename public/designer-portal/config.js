// Designer Portal Configuration
const CONFIG = {
    // Backend API Configuration
    API: {
        // Local development
        LOCAL: 'http://localhost:8080',
        
        // Staging - Instantlly Cards Backend
        STAGING: 'https://api-test.instantllycards.com',
        
        // Production - Instantlly Cards Backend
        PRODUCTION: 'https://api.instantllycards.com'
    },
    
    // Determine which API to use
    getApiBaseUrl() {
        // Use staging server
        return this.API.STAGING;
    }
};
