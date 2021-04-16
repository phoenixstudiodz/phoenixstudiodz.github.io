/* Proprietary and confidential software of ARIScience. All rights reserved. (c) 2017-2021 ARIScience */
// captcha element
var captchaV2 = null;
// ThresHold
var SCORE_THRESHOLD = 0.4;
// keys
var SITE_KEY_V2 = "6Ldih7IZAAAAAI3rOpbw68iNMh46hYd6br3-uYU5";
var SITE_KEY_V3 = "6Lcf37IZAAAAANU7C0w70ctfswDakm_1zQGu3Brg";
// validation of v2 captcha
function validateV2(token) {
    fetch("/captchav23.php", {
        method: "POST",
        body: JSON.stringify({
            action: "page",
            token,
            version: 2,
        })
    })
        .then(response => response.json())
        .then(response => {
            if (response && response.success) {
                setTimeout(() => {
                    grecaptcha.reset();
                    var captchaContainers = document.querySelectorAll('captcha');
                    if(captchaContainers && captchaContainers.length > 0){
                        captchaContainers.forEach(node =>{
                            node.parentNode.removeChild( node );
                        })
                    }
                }, 1000);

            }
        });
}
// validation of v3 captcha
function validateV3(page) {
    page = page || 'page_name_is_missing';
    grecaptcha.ready(function () {
        grecaptcha.execute(SITE_KEY_V3, { action: page }).then(function (token) {
            fetch("/captchav23.php", {
                method: "POST",
                body: JSON.stringify({
                    action: page,
                    token,
                    version: 3,
                })
            })
                .then(response => response.json())
                .then(response => {
                    if(response && response.score < SCORE_THRESHOLD ){
                        var captchaV2Div = document.querySelector('.capcha-location');
                        captchaV2Div.style.position = 'relative';
                        var captchaContainer = document.createElement('captcha');
                        captchaContainer.style.position = 'absolute';
                        captchaContainer.style.zIndex = 100000000;
                        captchaContainer.style.top = 0;
                        captchaContainer.style.left = 0;
                        captchaContainer.style.minWidth = '100%';
                        captchaContainer.style.minHeight = '100%';
                        captchaV2Div.appendChild(captchaContainer);
                        captchaV2 = grecaptcha.render(captchaContainer, {
                            sitekey: SITE_KEY_V2,
                            callback: validateV2
                        });
                    }
                })
        });
    });
}

    
