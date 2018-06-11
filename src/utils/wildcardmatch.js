module.exports = {
    matchURL : function(urllist, target) {
        const exp = "[^\s]+";
        for (url of urllist) {
            const url2 = url.replace('*',exp);
            if (target.match(new RegExp(url2))) return true
        }
        return false;
    }
}