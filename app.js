import {app, errorHandler} from 'mu';
import {ensureTrailingSlash} from "./helper";
import {findOfferingDetails, getPaymentInformationFromPaymentId, saveOrder, updateOrder} from "./buy";
import bodyParser from 'body-parser';
import {getSales} from "./sales";
import {getPurchases} from "./purchases";
import {sendSyncOfferingsTask} from "./tasks";

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

    res.send(JSON.stringify(orderInfo));
});

app.post('/buy/callback', bodyParser.json(), async (req, res) => {
    const paymentId = req.body.paymentId;
    if (paymentId === undefined) {
        res.status(400).send('Missing payment id');
        return;
    }

    console.log('Payment callback for payment id ' + paymentId);
    const paymentInformation = await getPaymentInformationFromPaymentId(paymentId);
    if (!Array.isArray(paymentInformation.results.bindings) || paymentInformation.results.bindings.length === 0) {
        throw new Error(`No payment information found for payment ID '${paymentId}'.`);
    }
    const orderStatus = paymentInformation.results.bindings[0].orderStatus.value;
    const buyerPod = ensureTrailingSlash(paymentInformation.results.bindings[0].buyerPod.value);
    const sellerPod = ensureTrailingSlash(paymentInformation.results.bindings[0].sellerPod.value);
    const orderId = paymentInformation.results.bindings[0].order.value;
    const sellerWebId = paymentInformation.results.bindings[0].seller.value;
    const buyerWebId = paymentInformation.results.bindings[0].customer.value;
    console.log(`Order status is '${orderStatus}'.`);

    if (await updateOrder(buyerPod, sellerPod, orderId, paymentId, sellerWebId, buyerWebId)) {
        res.send('OK');
    } else {
        res.status(500).send('Order update failed');
    }
});

app.get('/sales', async (req, res) => {
    const sellerWebId = decodeURIComponent(req.query.sellerWebId);
    if (sellerWebId === undefined) {
        res.status(400).send('Missing sellerWebId');
        return;
    }

    const sales = await getSales(sellerWebId);

    res.send(JSON.stringify(sales));
});

app.get('/purchases', async (req, res) => {
    const buyerWebId = decodeURIComponent(req.query.buyerWebId);
    if (buyerWebId === undefined) {
        res.status(400).send('Missing buyerWebId');
        return;
    }

    const purchases = await getPurchases(buyerWebId);

    res.send(JSON.stringify(purchases));
});

app.post('/sync', async (req, res) => {
    let pod = req.body.pod;
    if (pod === undefined) {
        res.status(400).send('Missing pod');
        return;
    }
    pod = ensureTrailingSlash(pod);
    const webId = req.body.webId;
    if (webId === undefined) {
        res.status(400).send('Missing webId');
        return;
    }

    if (await sendSyncOfferingsTask(webId, pod)) {
        res.send('OK');
    } else {
        res.status(500).send('Sync failed');
    }
});

app.use(errorHandler);
