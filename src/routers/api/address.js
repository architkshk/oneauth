const router = require('express').Router()
const {db} = require('../../db/models')
const cel = require('connect-ensure-login')
const Raven = require('raven')
const {hasNull} = require('../../utils/nullCheck')

const {
    findOrCreateDemographic,
    updateAddressbyDemoId,
    updateAddressbyAddrId,
    findDemographic,
    createAddress
} = require('../../controllers/demographics');

router.post('/', cel.ensureLoggedIn('/login'),async function (req, res) {
    if (hasNull(req.body, ['first_name', 'last_name', 'number', 'email', 'pincode', 'street_address', 'landmark', 'city', 'stateId', 'countryId'])) {
        res.send(400)
    } else {
        if (req.query) {
            var redirectUrl = req.query.returnTo;
        }
        try {
            const [demographics, created] = await findOrCreateDemographic(req.user.id);
            const options = {
                label: req.body.label || null,
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                mobile_number: req.body.number,
                email: req.body.email,
                pincode: req.body.pincode,
                street_address: req.body.street_address,
                landmark: req.body.landmark,
                city: req.body.city,
                stateId: req.body.stateId,
                countryId: req.body.countryId,
                demographicId: demographics.id,
                whatsapp_number: req.body.whatsapp_number || null,
                // if no addresses, then first one added is primary
                primary: !demographics.get().addresses
            }
            const address = await createAddress(options); 
            if (req.body.returnTo) {
                res.redirect(req.body.returnTo)
            } else{
                res.redirect('/address/' + address.id)
            }           
        } catch (err) {
            Raven.captureException(err)
            req.flash('error', 'Error inserting Address')
            res.redirect('/users/me')
        }
    }
})

router.post('/:id', cel.ensureLoggedIn('/login'), async function (req, res) {
    if (hasNull(req.body, ['first_name', 'last_name', 'number', 'email', 'pincode', 'street_address', 'landmark', 'city', 'stateId', 'countryId'])) {
        return res.send(400)
    }
    let addrId = parseInt(req.params.id)
    let userId = parseInt(req.user.id)


    try {
        await db.transaction(async (t) => {
            if (req.body.primary === 'on') {
                let demo = await findDemographic(req.user.id);
                let demoId = demo.id
                await updateAddressbyDemoId(demoId, {primary: false})
            }

            await updateAddressbyAddrId(addrId,{
                    label: req.body.label || null,
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    mobile_number: req.body.number,
                    email: req.body.email,
                    pincode: req.body.pincode,
                    street_address: req.body.street_address,
                    landmark: req.body.landmark,
                    city: req.body.city,
                    stateId: req.body.stateId,
                    countryId: req.body.countryId,
                    whatsapp_number: req.body.whatsapp_number || null,
                    primary: req.body.primary === 'on'
                })
            if (req.body.returnTo) {
                return res.redirect(req.body.returnTo)
            } else {
                return res.redirect(`/address/${addrId}`)
            }
        })

    } catch (err) {
        Raven.captureException(err)
        req.flash('error', 'Could not update address')
        res.redirect('/address')
    }

})


module.exports = router

