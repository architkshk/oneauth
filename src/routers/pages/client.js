/**
 * Created by championswimmer on 13/03/17.
 */
const router = require('express').Router()
const cel = require('connect-ensure-login')
const acl = require('../../middlewares/acl')

const models = require('../../db/models').models

router.get('/',acl.ensureAdmin,function (req,res,next) {
    models.Client.findAll({})
        .then(function (clients) {
            return res.render('client/all',{clients:clients})
        }).catch(function(err){
            res.send("No clients Registered")
    })
})

module.exports = router