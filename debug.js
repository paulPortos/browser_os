// Debug script to test application launching
// Run this in the browser console to test the launch behavior

console.log('🔧 Starting BrowserOS Debug Test');

// Test 1: Direct event emission
console.log('\n--- Test 1: Direct Event Emission ---');
eventManager.emit('app:launch', {
    appId: 'finder',
    title: 'Finder Test'
});

// Test 2: Simulate desktop icon click
console.log('\n--- Test 2: Desktop Icon Click Simulation ---');
const desktopIcon = document.querySelector('.desktop-icon[data-app="finder"]');
if (desktopIcon) {
    desktopIcon.dispatchEvent(new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        view: window
    }));
}

// Test 3: Simulate dock item click
console.log('\n--- Test 3: Dock Item Click Simulation ---');
const dockItem = document.querySelector('.dock-item[data-app="terminal"]');
if (dockItem) {
    dockItem.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    }));
}

console.log('🔧 Debug test completed. Check above logs for duplicate events.');
