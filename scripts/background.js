console.log(" in back service worker...");
// chrome.webRequest.onBeforeRequest.addListener(
//     function(details) {
//         console.log("here in requesr....",details.url);
//         return {cancel: details.url.indexOf("evil.com") != -1};
//     },
//     {urls: ["https://*/*"]}
//     ["request"]
// );