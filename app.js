import {app, errorHandler} from 'mu';
import {ensureTrailingSlash} from "./helper";
import {findOfferingDetails, saveOrder} from "./buy";
import {sendSavedOrderTask} from "./tasks";

const brokerWebId = process.env.BROKER_WEB_ID;

app.post('/buy', async (req, res) => {
    let buyerPod = req.body.buyerPod;
    if (buyerPod === undefined) {
        res.status(400).send('Missing buyerPod');
        return;
    }
    buyerPod = ensureTrailingSlash(buyerPod);
    const buyerWebId = req.body.buyerWebId;
    if (buyerWebId === undefined) {
        res.status(400).send('Missing buyerWebId');
        return;
    }
    let sellerPod = req.body.sellerPod;
    if (sellerPod === undefined) {
        res.status(400).send('Missing sellerPod');
        return;
    }
    sellerPod = ensureTrailingSlash(sellerPod);
    const offeringId = req.body.offeringId;
    if (offeringId === undefined) {
        res.status(400).send('Missing offeringId');
        return;
    }

    const offerings = await findOfferingDetails(buyerPod, sellerPod, offeringId);
    if (!Array.isArray(offerings.results.bindings) || !offerings.results.bindings.length) {
        res.status(404).send('Offering not found');
        return;
    }
    const offering = offerings.results.bindings[0];

    const orderInfo = await saveOrder(offering, buyerPod, sellerPod, buyerWebId, offering.sellerWebId.value, brokerWebId);

    await sendSavedOrderTask(orderInfo.orderUUID);

    res.send(JSON.stringify(orderInfo));
});

app.use(errorHandler);
