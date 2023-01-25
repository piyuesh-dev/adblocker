let possibleAdsLabel = ["advertisement", "ad", "ads"];
let adLabelObj = {
    "advertisement":1,
    "\"advertisement\"":1,
    "ad":1,
    "\"ad\"":1,
    "ads":1,
    "\"ads\"":1,
};
// don't run our script on below domains just not to effect their functionality...
let whitelistDomains = [
    "google",
    "vimeo",
    "instagram",
    "facebook",
    "spotify",
    "github",
    "bitbucket",
    "azure",
    "atlassian",
    "amazon",
    "flipkart",
    "walmart",
];
let scriptEnable = true;

for (let index = 0; index < whitelistDomains.length; ++index) {
    const allowedDomain = whitelistDomains[index];

    if (location.hostname.indexOf(allowedDomain) != -1) {
        scriptEnable = false;
        break;
    }
}

/**
 * Finds all divs which acts as ads container, and hide them or their most relevant parent.
 */
findAllEmptyAdDivs = (rootEl) => {
    // find all Divs with text or content equals to "advertisement" or "ad", "ads"...and hide them
    let allAfterBeforeDivs = Array.from(rootEl.querySelectorAll('div,span')).filter((divEl)=>{
        let val1 = getComputedStyle(divEl, ':before').getPropertyValue('content').toLowerCase();
        let val2 = getComputedStyle(divEl, ':after').getPropertyValue('content').toLowerCase();
        let val3 = divEl.innerText && divEl.innerText.toLowerCase();

        return ((val1 in adLabelObj) || (val2 in adLabelObj) || (val3 in adLabelObj));
    });
    // find divs with data-ad-slot or data-ad-unit, etc...hide them....
    allAfterBeforeDivs = allAfterBeforeDivs.concat(Array.from(
        rootEl.querySelectorAll(`
            div[data-ad-slot],
            div[data-adsslot],
            div[data-adslot],
            div[data-ad-unit],
            div[data-adunit],
            div[data-adcode],
            div[id*="gpt_ad"],
            div[id*="div-gpt-ad"],
            div[id*="ad-slot"],
            div[id*="adslot"],
            div[class*="adHeight"],
            div[class*="adWidth"],
            div[class*="ad-height"],
            div[class*="ad-width"],
            div[class*="ad-slot"],
            .adunitContainer,
            .adBox,
            .ad-container,
            .dotcom-ad,
            display-ads,
            views-native-ad
            `)
    ));

    // find all divs without any advertisement text...but they are empty...e.g. mint.com
    if (rootEl == document) {
        var headContent = rootEl.getElementsByTagName('head')[0].innerHTML;
        var bodyContent = rootEl.getElementsByTagName('body')[0].innerHTML;

        let tmpArr1 = findAdDivsAsPerRegex(headContent);
        let tmpArr2 = findAdDivsAsPerRegex(bodyContent);
        allAfterBeforeDivs = allAfterBeforeDivs.concat(tmpArr1, tmpArr2);
    } else {
        var elementContent = rootEl.innerHTML;

        let tmpArr1 = findAdDivsAsPerRegex(elementContent);
        allAfterBeforeDivs = allAfterBeforeDivs.concat(tmpArr1);
    }

    if (allAfterBeforeDivs && allAfterBeforeDivs.length) {
        for(var index=0; index<allAfterBeforeDivs.length; ++index) {
            let divEl = allAfterBeforeDivs[index];

            // find top most parent of iframe which has no other child or a script child
            // or only a text child with text ads|advertisement
            let topParentEl = findTopParent(divEl);
            // https://stackoverflow.com/a/38454562
            topParentEl ? topParentEl.style = "display: none!important" : "";
        }
    }
}

// https://regex101.com/r/GqKaIZ/1 and https://regex101.com/r/fUVRvh/1
// try to grep window.innerHTML for googletag.defineSlot or googletag.display
// find div ids for ads rendering and hide all those divs..
function findAdDivsAsPerRegex(htmlString) {
    let regexAds1 = /defineSlot\(.*?('|")([^'"]*)('|")\)/gi;
    let regexAds2 = /(googletag|gpt).display\(['"]{1}(.*?)['"]{1}\)/gi;
    let anySlots = []; // for regex matches...both regex has group2 as div id...
    let foundDivs = [];

    while (tmpArr = regexAds1.exec(htmlString)) {
        anySlots.push(tmpArr);
    }
    while (tmpArr = regexAds2.exec(htmlString)) {
        anySlots.push(tmpArr);
    }

    if (anySlots && anySlots.length) {
        for(let j=0; j<anySlots.length; ++j) {
            let divId = anySlots[j][2];
            // console.log("found div id---",divId);
            let divEl = document.getElementById(divId);
            divEl ? foundDivs.push(divEl): "";
        }
    }
    return foundDivs;
}

// find top most parent of iframe which has no other child...or only a script or text child...
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

// to handle cases for display ads where "Advertisement"|"Ad"|"Ads" is only one node above/below actual google ad..
function findOnlyTextChildParent(childEl) {
    let parentEl = childEl.parentElement;
    let childNodes = parentEl.children;
    let child1Text = childNodes[0].innerText && childNodes[0].innerText.toLowerCase();
    let child2Text = childNodes[1].innerText && childNodes[1].innerText.toLowerCase();

    // or only script nodes...as 2nd child...
    if (childNodes[0].nodeName.toLowerCase() == "script" || childNodes[1].nodeName.toLowerCase() == "script" ||
        childNodes[0].nodeName.toLowerCase() == "br" || childNodes[1].nodeName.toLowerCase() == "br")
        return findTopParent(parentEl);
    
    // only consider innerText value if other child is empty...., else just hide childEl
    // so that we don't hide any valid non-ad content from html
    let needToFindParent = possibleAdsLabel.find((element) => {
        return ((element==child1Text && child2Text=="")
                || (element==child2Text && child1Text==""));
    });
    if(needToFindParent) {
        return findTopParent(parentEl);
    } else {
        return childEl;
    }
}

/*
 * Adds css rules to hide known ads container...
*/
function addStyleSheetAds() {
    var style = document.createElement('style');
    style.innerHTML = `
    #player-ads {
        display:none !important;
    }
    .ad-container, .dotcom-ad, .adunitContainer, .adBox {
        display:none !important;
    }
    div[id^="gpt_ad"] {
        display: none;
    }
    div[id*="ad-slot"] {
        display:none !important;
    }
    div[id*="div-gpt-ad"] {
        display: none;
    }
    .ad-slot, .adSlot {
        display:none !important;
    }
    ins[class="adsbygoogle"] {
        display:none !important;
    }
    display-ads {
        display:none !important;
    }
    views-native-ad {
        display:none !important;
    }
    div[data-ad-slot] {
        display:none !important;
    }
    div[id*="adslot"] {
        display:none !important;
    }
    div[class*="adHeight"], div[class*="ad-height"] {
        display:none !important;
    }
    div[class*="adWidth"], div[class*="ad-width"], div[class*="ad-slot"] {
        display:none !important;
    }
    `;
    document.head.appendChild(style);  
}

/**
 * It hides/skips youtube ads as soon as they show up,
 * solution found at https://stackoverflow.com/a/58933059/1331003
 */
hideYoutubeAds = () => {
    var count = 0;
    // counter is added, when there are 2 ads back to back....so that we can hide 2nd one also...
    var counterFun = setInterval(() => {
        if (count >= 5) {
            clearInterval(counterFun);
        }
        const ad = document.querySelector('.html5-video-player.ad-created.ad-showing');
        if (ad) {
            const video = ad.querySelector('video');
            // skip video to end of it's duration...or click on skip if available...
            if (video) {
                let skipButton = ad.querySelector("button.ytp-ad-skip-button");
                // console.log("time is-------------",video.currentTime);
                // console.log("duration is-------------",video.duration);

                if (skipButton) {
                    skipButton.click();
                } else if (video.duration) {
                    video.currentTime = video.duration;
                }
            }
        }
        ++count;
    }, 300);
}

// We need to listen to some events when top url changes while scrolling down...
// Select the node that will be observed for mutations
let oldHref = document.location.href;

// Options for the observer (which mutations to observe)
const config = { attributes: false, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = (mutationList, observer) => {
    // When top url changes, e.g. on news sites upon scrolling top url reflects the article being read...
    // we need to re-run all process again to hide ads divs...
    if (oldHref != document.location.href) {
        try {
            findAllEmptyAdDivs(document);
            oldHref = document.location.href;
        } catch (ex) {
            // do nothing....
        }
    }
};

// Callback function to execute when mutations are observed
const callbackYt = (mutationList, observer) => {
    // When youtube video ads div changed, e.g. content added...
    // we need to re-run function to skip video ads
    for (const mutation of mutationList) {
        if (mutation.type === 'childList') {
            // console.log('A child node has been added or removed.');
            // find if ads overlay is added...then we can call our function to hide ads...ytp-ad-player-overlay
            if (mutation.addedNodes && mutation.addedNodes.length) {
                let videoAdsOverlay = mutation.target.querySelector(".ytp-ad-player-overlay");

                // console.log("found ads overlay..., now hide ads...");
                videoAdsOverlay ? hideYoutubeAds() : "";
                break;
            }
        } else if (mutation.type === 'attributes') {
            // console.log(`The ${mutation.attributeName} attribute was modified.`);
        }
    }
};

if(scriptEnable) {
    if (location.hostname.indexOf("youtube") != -1) {
        addStyleSheetAds();
        var setupObserverInterval = setInterval(() => {
            let videoAdsDiv = document.querySelector(".video-ads.ytp-ad-module");
            const observerYt = new MutationObserver(callbackYt);

            if (videoAdsDiv) {
                clearInterval(setupObserverInterval);
                observerYt.observe(videoAdsDiv, config);
                hideYoutubeAds();
            }
        },500);
    } else {
        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(callback);
        setTimeout(() => {
            try {
                addStyleSheetAds();
                findAllEmptyAdDivs(document);    
            } catch (ex) {
                // do nothing...
            }
            // Start observing the target node for configured mutations
            observer.observe(document, config);
        }, 300);
    }

    // Later, you can stop observing
    // observer.disconnect();
}