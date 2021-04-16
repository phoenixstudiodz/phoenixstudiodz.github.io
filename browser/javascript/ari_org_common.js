/* Proprietary and confidential software of ARIScience. All rights reserved. (c) 2017-2021 ARIScience */
// reset Page usage (used for debug)
function resetPageUsage() {
    localStorage.setItem('usage', JSON.stringify([]));
    document.getElementById('from-ever').innerHTML = 0;
    document.getElementById('last-24h').innerHTML = 0;
    document.getElementById('last-week').innerHTML = 0;
}
/* 
    update page usage, read the current usage and append new 
    value that contain the usage time into an array 
*/
function updateUsage() {
    usage = JSON.parse(localStorage.getItem('usage'));
    if (!usage) {
        usage = [{ t: new Date().getTime() }];
        localStorage.setItem('usage', JSON.stringify(usage));
    }
    else {
        usage = [...usage, { t: new Date().getTime() }];
        localStorage.setItem('usage', JSON.stringify(usage));
    }
}
// check if the url contain debug=true, if yes display page usage at the top left
function displayUsage() {
    var url = new URL(window.location.href);
    var debug = url.searchParams.get("debug");
    if (debug) document.getElementById('debug-usage').style.display = 'block';
    var usage = JSON.parse(localStorage.getItem('usage'));
    if (usage) {
        document.getElementById('from-ever').innerHTML = usage.length;
        var time = new Date().getTime();
        var lastWeek = usage.reduce((sum, el) => {
            if (el.t > (time - (24 * 60 * 60 * 1000 * 7))) return sum + 1;
            else return sum;
        }, 0)
        document.getElementById('last-week').innerHTML = lastWeek;
        var last24h = usage.reduce((sum, el) => {
            if (el.t > (time - (24 * 60 * 60 * 1000))) return sum + 1;
            else return sum;
        }, 0)
        document.getElementById('last-24h').innerHTML = last24h;

    }
}
/* this function check if "http://ww....page.html?debug=true 
    is present and display the usage 
*/
displayUsage();
// update page usage
updateUsage();
