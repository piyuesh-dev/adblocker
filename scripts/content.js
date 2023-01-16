let possibleAdsLabel = ["advertisement", "ad", "ads"];
let adLabelObj = {
    "advertisement":1,
    "\"advertisement\"":1,
    "ad":1,
    "\"ad\"":1,
    "ads":1,
    "\"ads\"":1,
}

findAllEmptyAdDivs = (rootEl) => {
    // find all Divs with text or content "advertisement"...and hide them
    let allAfterBeforeDivs = Array.from(rootEl.querySelectorAll('div,span')).filter((divEl)=>{
        let val1 = getComputedStyle(divEl, ':before').getPropertyValue('content').toLowerCase();
        let val2 = getComputedStyle(divEl, ':after').getPropertyValue('content').toLowerCase();
        let val3 = divEl.innerText && divEl.innerText.toLowerCase();

        return ((val1 in adLabelObj) || (val2 in adLabelObj) || (val3 in adLabelObj));
    });
    console.dir(allAfterBeforeDivs);
    // find divs with data-ad-slot or data-ad-unit...hide them....
    allAfterBeforeDivs = allAfterBeforeDivs.concat(Array.from(
        rootEl.querySelectorAll(`
            div[data-ad-slot],
            div[data-adsslot],
            div[data-adslot],
            div[data-ad-unit],
            div[data-adcode],
            div[id*="gpt_ad"],
            div[id*="div-gpt-ad"]`)
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

            // // find top most parent of iframe which has no other child...
            let topParentEl = findTopParent(divEl);
            // https://stackoverflow.com/a/38454562
            topParentEl.style = "display: none!important";
        }
    }
}

// https://regex101.com/r/GqKaIZ/1
// https://regex101.com/r/fUVRvh/1
// try to grep window.innerHTML for googletag.defineSlot.... and hide all those divs..
function findAdDivsAsPerRegex(htmlString) {
    let regexAds1 = /defineSlot\(.*?('|")([^'"]*)('|")\)/g;
    let regexAds2 = /(googletag|gpt).display\(['"]{1}(.*?)['"]{1}\)/g;
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

// to handle cases for display ads where "Advertisement" is one node above actual google ad..
function findOnlyTextChildParent(childEl) {
    let parentEl = childEl.parentElement;
    let childNodes = parentEl.children;
    let child1Text = childNodes[0].innerText && childNodes[0].innerText.toLowerCase();
    let child2Text = childNodes[1].innerText && childNodes[1].innerText.toLowerCase();

    // or only script nodes...as 2nd child...
    if (childNodes[0].nodeName.toLowerCase() == "script" || childNodes[1].nodeName.toLowerCase() == "script")
        return findTopParent(parentEl);
    
    // only consider innerText value if other child is empty...., else just hide childEl
    // so that we don't hide any valid non-ad content from html
    if(possibleAdsLabel.find((element) => {return ((element==child1Text && child2Text=="") || (element==child2Text && child1Text==""));})) {
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
    #target {
    color: blueviolet;
    }
    div[id^="gpt_ad"] {
        display: none;
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
    div[data-ad-slot] {
        display:none !important;
    }
    `;
    document.head.appendChild(style);  
}

// Select the node that will be observed for mutations
const targetNode = document.body;
let oldHref = document.location.href;

// Options for the observer (which mutations to observe)
const config = { attributes: false, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (oldHref != document.location.href) {
        // console.log(" url changed at the top....");
        try {
            findAllEmptyAdDivs(document);
            oldHref = document.location.href;
        } catch (ex) {
            // do nothing....
        }
        break;
    }
    if (mutation.type === 'childList') {
      if(mutation.addedNodes && mutation.addedNodes.length) {
        // nothing...
      }
    } else if (mutation.type === 'attributes') {
      console.log(`The ${mutation.attributeName} attribute was modified.`);
    }
  }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

setTimeout(() => {
    addStyleSheetAds();
    findAllEmptyAdDivs(document);
    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
}, 500);

// Later, you can stop observing
// observer.disconnect();