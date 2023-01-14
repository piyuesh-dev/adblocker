// findAdsIframe = () => {
//     const iframes = document.querySelectorAll("iframe");

//     // find all iframes for google ads, and hide them...
//     if (iframes && iframes.length) {
//         for(var index=0; index<iframes.length; ++index) {
//             let iframeEl = iframes[index];

//             if(!iframeEl.getAttribute)
//                 continue;
//             let srcVal = iframeEl.getAttribute("src");
//             let idVal = iframeEl.getAttribute("id");
    
//             // console.log(srcVal);
//             if(srcVal && srcVal.match("googleads") ||
//                 idVal && idVal.match("google_ads_iframe_")) {
//                 // find top most parent of iframe which has no other child...
//                 let topParentEl = findTopParent(iframeEl);
//                 topParentEl.style.display = "none";
//             }
//         }
//     }
// };

// findTaboolaContent = () => {
//     const taboolaDivs = document.querySelectorAll(".trc_rbox_container");

//     // find all sponsored contents for taboola, and hide them...
//     if (taboolaDivs && taboolaDivs.length) {
//         for(var index=0; index<taboolaDivs.length; ++index) {
//             let divEl = taboolaDivs[index];

//             // find top most parent of iframe which has no other child...
//             let topParentEl = findTopParent(divEl);
//             topParentEl.style.display = "none";
//         }
//     }
// }

// findFireworkContent = () => {
//     const fireWorkDivs = document.querySelectorAll("fw-storyblock");

//     // find all sponsored contents for taboola, and hide them...
//     if (fireWorkDivs && fireWorkDivs.length) {
//         for(var index=0; index<fireWorkDivs.length; ++index) {
//             let divEl = fireWorkDivs[index];

//             // find top most parent of iframe which has no other child...
//             let topParentEl = findTopParent(divEl);
//             topParentEl.style.display = "none";
//         }
//     }
// }

findAllEmptyAdDivs = () => {
    // find all Divs with text or content "advertisement"...and hide them
    let allAfterBeforeDivs = Array.from(document.querySelectorAll('div')).filter((divEl)=>{
        let val1 = getComputedStyle(divEl, ':before').getPropertyValue('content').toLowerCase();
        let val2 = getComputedStyle(divEl, ':after').getPropertyValue('content').toLowerCase();
        let val3 = divEl.innerText && divEl.innerText.toLowerCase();
        return (val1 == "\"advertisement\"" || val2 == "\"advertisement\"" || val3 == "advertisement");
    });

    // find all divs without any advertisement text...but they are empty...e.g. mint.com
    // try to grep window.innerHTML for googletag.defineSlot.... and hide all those divs..
    // var headContent = document.getElementsByTagName('head')[0].innerHTML;
    // var bodyContent = document.getElementsByTagName('body')[0].innerHTML;

    // let regexAds = /defineSlot\(.*?('|")([^'"]*)('|")\)/g;
    // let anySlots1=[];
    // let anySlots2=[];

    // while (tmpArr = regexAds.exec(headContent)) {
    //     anySlots1.push(tmpArr);
    // }
    // while (tmpArr = regexAds.exec(bodyContent)) {
    //     anySlots2.push(tmpArr);
    // }

    // if (anySlots1 && anySlots1.length) {
    //     for(let j=0; j<anySlots1.length; ++j) {
    //         let divId = anySlots1[j][2];
    //         console.log("found div id---",divId);
    //         let divEl = document.getElementById(divId);
    //         divEl ? allAfterBeforeDivs.push(divEl): "";
    //     }
    // }
    // if (anySlots2 && anySlots2.length) {
    //     for(let j=0; j<anySlots2.length; ++j) {
    //         let divId = anySlots2[j][2];
    //         console.log("found div id---",divId);
    //         let divEl = document.getElementById(divId);
    //         divEl ? allAfterBeforeDivs.push(divEl): "";
    //     }
    // }
    if (allAfterBeforeDivs && allAfterBeforeDivs.length) {
        for(var index=0; index<allAfterBeforeDivs.length; ++index) {
            let divEl = allAfterBeforeDivs[index];

            // // find top most parent of iframe which has no other child...
            let topParentEl = findTopParent(divEl);
            // https://stackoverflow.com/a/38454562
            topParentEl.style = "display: none!important";
        }
    }
}

// find top most parent of iframe which has no other child...
function findTopParent(childEl) {
    let parentEl = null;

    if (childEl) {
        parentEl = childEl.parentElement;

        if (parentEl && parentEl.children) {
            if (parentEl.children.length == 1) {
                return findTopParent(parentEl);
            } else if (parentEl.children.length == 2) {
                return findOnlyTextChildParent(childEl);
            } else if (parentEl.children.length > 2) {
                return childEl;
            }
        }
    }

    return parentEl;
}

// to handle cases for display ads where "Advertisement" is one node above actual google ad..
function findOnlyTextChildParent(childEl) {
    let parentEl = childEl.parentElement;
    let childNodes = parentEl.children;

    if((childNodes[0].innerText && childNodes[0].innerText.toLowerCase() == "advertisement") ||
     (childNodes[1].innerText && childNodes[1].innerText.toLowerCase() == "advertisement")) {
        return parentEl;
    } else {
        return childEl;
    }
}

// listen for an event, whenever a iframe is added...
document.addEventListener("load", ()=>{
    // findAdsIframe();
    // findTaboolaContent();
    // findFireworkContent();
});

// Select the node that will be observed for mutations
const targetNode = document.body;

// Options for the observer (which mutations to observe)
const config = { attributes: false, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    // console.log("mutatin is ::::",mutation.type);

    if (mutation.type === 'childList') {
    //   console.log('A child node has been added or removed.', mutation.addedNodes[0].nodeName);
      if(mutation.addedNodes && mutation.addedNodes.length) {
            findAllEmptyAdDivs();
        // for(let j in mutation.addedNodes) {
        //     let nodeVal = mutation.addedNodes[j];
        //     let nodeName = nodeVal.nodeName || "dummy";

        //     // list src of all script nodes....and just block google ads script...
        //     if(nodeName.toLowerCase() == "script") {
        //         console.log(nodeVal.getAttribute("src"));
        //     }
        // }
      }

    //   findAdsIframe();
    //   findTaboolaContent();
    //   findFireworkContent();
    } else if (mutation.type === 'attributes') {
      console.log(`The ${mutation.attributeName} attribute was modified.`);
    }
  }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

setTimeout(() => {
    // findAdsIframe();
    findAllEmptyAdDivs();
    // Start observing the target node for configured mutations
    // observer.observe(targetNode, config);
}, 4000);

// Later, you can stop observing
// observer.disconnect();