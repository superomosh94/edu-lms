const path = require('path');

console.log('🔍 Debugging auth controller...');

try {
    const authController = require('./app/controllers/authController');
    console.log('✅ AuthController loaded successfully');
    
    // Check all exported methods
    const methods = Object.keys(authController);
    console.log('📋 Available methods:', methods);
    
    // Check specific methods
    const requiredMethods = [
        'loginView', 'loginPost', 'registerView', 'registerPost',
        'forgotPasswordView', 'forgotPasswordPost', 
        'resetPasswordView', 'resetPasswordPost', 'logout'
    ];
    
    console.log('\n🔎 Checking required methods:');
    requiredMethods.forEach(method => {
        const exists = typeof authController[method] === 'function';
        console.log(`   ${exists ? '✅' : '❌'} ${method}: ${exists ? 'EXISTS' : 'MISSING'}`);
    });
    
} catch (error) {
    console.error('❌ Error loading authController:', error.message);
    console.error('Full error:', error);
}