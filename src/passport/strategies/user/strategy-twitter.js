/**
 * Created by championswimmer on 07/05/17.
 */
const Raven = require('raven')
const TwitterStrategy = require('passport-twitter-email').Strategy

const models = require('../../../db/models').models

const config = require('../../../../config')
const secrets = config.SECRETS
const passutils = require('../../../utils/password')

/**
 * Authenticate _users_ using their Twitter accounts
 */

module.exports = new TwitterStrategy({
    consumerKey: secrets.TWITTER_CONSUMER_KEY,
    consumerSecret: secrets.TWITTER_CONSUMER_SECRET,
    callbackURL: config.SERVER_URL + config.TWITTER_CALLBACK,
    passReqToCallback: true
}, function (req, token, tokenSecret, profile, cb) {

    let profileJson = profile._json
    let oldUser = req.user
    Raven.setContext({extra: {file: 'twitterstrategy'}})
    if (oldUser) {
        if (config.DEBUG) console.log('User exists, is connecting Twitter account')
        models.UserTwitter.findOne({where: {id: profileJson.id}})
            .then((twaccount) => {
                if (twaccount) {
                    throw new Error('Your Twitter account is already linked with coding blocks account Id: ' + twaccount.dataValues.userId)
                }
                else {
                    models.UserTwitter.upsert({
                        id: profileJson.id,
                        token: token,
                        tokenSecret: tokenSecret,
                        username: profileJson.screen_name,
                        userId: oldUser.id
                    })
                        .then(function (updated) {
                            return models.User.findById(oldUser.id)
                        })
                        .then(function (user) {
                            return cb(null, user.get())
                        })
                        .catch((err) => Raven.captureException(err))
                }
            })
            .catch((err) => {
                return cb(null, false, {message: err.message})
            })
    }
    else {

        models.User.count({where: {username: profileJson.screen_name}})
            .then(function (existCount) {

                return models.UserTwitter.findCreateFind({
                    include: [models.User],
                    where: {id: profileJson.id},
                    defaults: {
                        id: profileJson.id,
                        token: token,
                        tokenSecret: tokenSecret,
                        username: profileJson.screen_name,
                        user: {
                            username: existCount === 0 ? profileJson.screen_name : profileJson.screen_name + "-t",
                            firstname: profileJson.name.split(' ')[0],
                            lastname: profileJson.name.split(' ').pop(),
                            gender:profileJson.gender||undefined,
                            email: profileJson.email || undefined,
                            photo: profileJson.profile_image_url_https.replace('_normal', '_400x400')
                        }
                    }
                })
            }).spread(function (userTwitter, created) {
            //TODO: Check created == true for first time
            if (!userTwitter) {
                return cb(null, false, {message: 'Authentication Failed'})
            }
            if (userTwitter.user) {
                return cb(null, userTwitter.user.get())
            }
            else {
                return cb(null, false, {message: 'Authentication Failed'})
            }
        }).catch((err) => {
            Raven.captureException(err)
        })


    }


})
