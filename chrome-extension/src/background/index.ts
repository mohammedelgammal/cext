// chrome.runtime.onInstalled.addListener(() => {
//   console.log('Extension installed');

//   // Clear any existing alarms
//   chrome.alarms.clearAll();

//   // Create an alarm that triggers every 30 seconds
//   chrome.alarms.create('simpleJob', {
//     periodInMinutes: 0.2, // 30 seconds (0.5 minutes)
//   });

//   // Initialize storage with default values
//   chrome.storage.local.set({
//     jobCount: 0,
//     lastRun: 'Never',
//     status: 'Active',
//   });
// });

// // The actual job that runs every 30 seconds
// const executeSimpleJob = () => {
//   console.log('Simple job executed at:', new Date().toLocaleTimeString());

//   // Get current values from storage
//   chrome.storage.local.get(['jobCount', 'lastRun'], result => {
//     const currentCount = result.jobCount || 0;
//     const newCount = currentCount + 1;

//     // Update storage with new values
//     chrome.storage.local.set({
//       jobCount: newCount,
//       lastRun: new Date().toLocaleTimeString(),
//     });

//     chrome.notifications.create({
//       type: 'basic',
//       iconUrl: chrome.runtime.getURL('icon-34.png'),
//       title: 'Job Completed',
//       message: `Job ran ${newCount} times. Last: ${new Date().toLocaleTimeString()}`,
//     });
//   });
// };

// // Listen for alarm triggers
// chrome.alarms.onAlarm.addListener(alarm => {
//   if (alarm.name === 'simpleJob') {
//     executeSimpleJob();
//   }
// });
