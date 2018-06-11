module.exports = {
    matchURL : function(urllist, target) {
        const exp = "[^\s]+";
        for (let url of urllist) {
            const url2 = url.replace('*',exp);
            if (target.match(new RegExp(url2))) {
                return true;
            }
        }
        return false;
    }
};