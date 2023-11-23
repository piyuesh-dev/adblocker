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
            div[data-ad-unit-path],
            div[data-adunit],
            div[data-adcode],
            div[data-ad-id],
            div[data-adwidth],
            div[data-ad],
            div[data-ad-format],
            div[data-ad-size],
            div[data-dfp-mobile],
            div[data-ads-core],
            div[id*="gpt_ad"],
            div[id*="gpt-ad"],
            div[id*="div-gpt-ad"],
            div[id*="ad-slot"],
            div[id*="adslot"],
            [id*="native_ad_nativead"],
            div[id*="bordeaux-standard-ad"],
            div[data-testid="StandardAd"],
            div[data-testid="top-ad-container-ad"],
            div[data-testid="ad-container"],
            div[data-testid*="Ad Container"],
            div[data-testid*="AdContainer"],
            div[data-widget-type="ads"],
            div[class*="adHeight"],
            div[class*="adWidth"],
            div[class*="dfpSlot"],
            div[class*="adMinHeight"],
            div[class*="adMinWidth"],
            div[class*="adBlock"],
            div[class*="ad-height"],
            div[class*="ad-width"],
            div[class*="ad-slot"],
            div[class*="ad-unit"],
            div[class*="ad-container"],
            div[id*="taboola"],
            div[data-content="Advertisement"],
            i[data-content="Advertisement"],
            ins[class="adsbygoogle"],
            amp-embed[type="taboola"],
            amp-ad,
            .adunitContainer,
            .adBox,
            .ad-container,
            .ad_container,
            .ads__container,
            .ad-text,
            .bbccom_advert,
            .advert__container,
            .gemini-ad,
            .native-ad-item,
            .dfp-ad,
            .dfp-slot,
            .dfp-leaderboard-container,
            #advertisement-title,
            .fig-ad-content,
            .display_ad,
            .m-block-ad,
            .adWrapper,
            .top-ad-wrapper,
            .text-ad,
            .amp-ad,
            .ad,
            .advertisement,
            .dom_annotate_multifeed_bundle_AdBundle,
            .dom_annotate_ad_image_ad,
            .dotcom-ad,
            #partners.river-section,
            display-ads,
            cs-native-ad-card,
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
    let regexAds1 = /defineSlot\(.*?('|")([^'"]*)('|")\)/gmi;
    let regexAds2 = /(googletag|gpt).display\(['"]{1}(.*?)['"]{1}\)/gmi;
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

// find top most parent of an ads div which has no other child...or only some script or text nodes as siblings...
function findTopParent(childEl) {
    let parentEl = null;

    if (childEl) {
        parentEl = childEl.parentElement;

        if (parentEl && parentEl.children) {
            if (parentEl.children.length == 1) {
                return findTopParent(parentEl);
            } else {
                return findOnlyScriptNodesParent(childEl);
            }
        }
    }

    return parentEl;
}

// check if only other sibling of an ads div are br or script tags, or only div with 'ad', 'ads' text....
function findOnlyScriptNodesParent(childEl) {
    let parentEl = childEl.parentElement;
    let childNodes = parentEl.children;
    let needToFindParent = true;

    // check if only other sibling of an ads div are br or script tags, or only div with 'ad'. 'ads' text....
    // then keep looking its parents....
    for(let x=0; x<childNodes.length && needToFindParent; ++x) {
        let nodeName = childNodes[x].nodeName ? childNodes[x].nodeName.toLowerCase() : "";
        let childText = childNodes[x].innerText && childNodes[x].innerText.toLowerCase();
        let childHtml = childNodes[x].innerHTML;

        if (childNodes[x] == childEl || nodeName.match(/script|br/)) {
            needToFindParent = true;
        } 
        else if (childHtml == "" && (childText == "" || childText in adLabelObj)) {
            needToFindParent = true;
        }
        else {
            needToFindParent = false;
        }
    }
    if (needToFindParent) {
        return findTopParent(parentEl);
    } else {
        return childEl;
    }
}

/**
 * It hides/skips youtube ads as soon as they show up,
 * solution found at https://stackoverflow.com/a/58933059/1331003
 */
hideYoutubeAds = () => {
    var count = 0;
    var skipAdsVideo = () => {
        const ad = document.querySelector('.html5-video-player.ad-created.ad-showing');
        if (ad) {
            const video = ad.querySelector('video');
            // skip video to end of it's duration...or click on skip if available...
            // ytp-ad-skip-button-modern
            if (video) {
                let skipButton = ad.querySelector("button.ytp-ad-skip-button,button.ytp-ad-skip-button-modern");
                // console.log("time is-------------",video.currentTime);
                // console.log("duration is-------------",video.duration);

                if (skipButton) {
                    skipButton.click();
                    // console.log(" hiding yt video....1");
                } else if (video.duration) {
                    video.currentTime = video.duration;
                    // console.log(" hiding yt video....2");
                }
            }
        }
    }
    // counter is added, when there are 2 ads back to back....so that we can hide 2nd one also...
    var counterFun = setInterval(() => {
        if (count >= 5) {
            clearInterval(counterFun);
        }
        skipAdsVideo();
        ++count;
    }, 300);
    skipAdsVideo();
}

/**
 * This method hides ads from gmail mail listing div....
 */
hideGmailAds = () => {
    const adSpanArr = Array.from(document.querySelectorAll('.aPd > .ast'));

    adSpanArr.forEach((item, index) => {
        if (item && item.innerText == "Ad") {
            item.closest("tr").style = "display: none!important";
        }
    });
}

// We need to listen to some events when top url changes while scrolling down...
// Select the node that will be observed for mutations
let oldHref = document.location.href;

// Options for the observer (which mutations to observe)
const config = { attributes: false, childList: true, subtree: true };
//var pageHeight = document.body.offsetHeight;

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

// Callback function to execute when mutations are observed
const callbackGmail = (mutationList, observer) => {
    // When youtube video ads div changed, e.g. content added...
    // we need to re-run function to skip video ads
    for (const mutation of mutationList) {
        if (mutation.type === 'childList') {
            // console.log('A child node has been added or removed.');
            // find if ads overlay is added...then we can call our function to hide ads...ytp-ad-player-overlay
            if (mutation.addedNodes && mutation.addedNodes.length) {
                hideGmailAds();
                break;
            }
        } else if (mutation.type === 'attributes') {
            hideGmailAds();
            break;
            // console.log(`The ${mutation.attributeName} attribute was modified.`);
        }
    }
};

if(scriptEnable) {
    if (location.hostname.indexOf("youtube") != -1) {
        var setupObserverInterval1 = setInterval(() => {
            let videoAdsDiv = document.querySelector(".video-ads.ytp-ad-module");

            // Create an observer to listen for changes on video ads element
            if (videoAdsDiv) {
                const observerYt = new MutationObserver(callbackYt);
                clearInterval(setupObserverInterval1);
                observerYt.observe(videoAdsDiv, config);
                hideYoutubeAds();
            }
        },200);
    } else if (location.hostname === "mail.google.com") {
        // Create an observer to listen for changes on main container in gmail, it rendered after some time...
        var setupObserverInterval2 = setInterval(() => {
            let mailDiv = document.querySelector("div.UI");

            // Create an observer to listen for changes on gmail main container element
            if (mailDiv) {
                const observerGmail = new MutationObserver(callbackGmail);
                clearInterval(setupObserverInterval2);
                observerGmail.observe(mailDiv, config);
                hideGmailAds();
            }
        },200);
    }
    else {
        // Create an observer to listen for changes on document element
        const observer = new MutationObserver(callback);
        setTimeout(() => {
            try {
                findAllEmptyAdDivs(document);    
            } catch (ex) {
                // do nothing...
            }
            // Start observing the target node for configured mutations
            observer.observe(document, config);
        }, 500);
    }

    // Later, you can stop observing
    // observer.disconnect();
}