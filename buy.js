import {sparqlEscapeUri, sparqlEscapeString} from 'mu';
import {querySudo as query, updateSudo as update} from '@lblod/mu-auth-sudo';
import {constructTermToString} from "./helper";
import {v4 as uuid} from 'uuid'
import {sendSavedOrderTask, sendUpdatedOrderTask} from "./tasks";

export async function findOfferingDetails(buyerPod, sellerPod, offeringId) {
    const offeringsQuery = `
    PREFIX gr: <http://purl.org/goodrelations/v1#>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    SELECT ?product ?currency ?currencyValue ?name ?description ?productName ?productDescription ?pod ?seller ?sellerWebId
    FROM <http://mu.semte.ch/graphs/public>
    WHERE {
        ?product a gr:ProductOrService.
        ?offering a gr:Offering.
        ?priceSpecification a gr:PriceSpecification;
            gr:hasCurrency ?currency;
            gr:hasCurrencyValue ?currencyValue.
        ?offering gr:name ?name;
            gr:description ?description;
            gr:includes ?product;
            ext:pod ?pod;
            gr:hasPriceSpecification ?priceSpecification.
        ?product gr:name ?productName;
            gr:description ?productDescription.
        ?sellerEntity a gr:BusinessEntity;
            gr:legalName ?seller;
            gr:description ?sellerWebId;
            gr:offers ?offering.
        FILTER (?offering = ${sparqlEscapeUri(offeringId)} && ?pod = ${sparqlEscapeUri(sellerPod)})
    }`;

    return query(offeringsQuery);
}

export async function getPaymentInformationFromPaymentId(paymentId) {
    const queryQuery = `
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX schema: <http://schema.org/>
    SELECT ?orderStatus ?buyerPod ?sellerPod ?order ?seller ?customer
    FROM <http://mu.semte.ch/application>
    WHERE {
        ?order a schema:Order;
            schema:paymentMethodId ${sparqlEscapeString(paymentId)};
            schema:orderStatus ?orderStatus;
            ext:sellerPod ?sellerPod;
            ext:buyerPod ?buyerPod;
            schema:seller ?seller;
            schema:customer ?customer.
    }`;

    return query(queryQuery);
}

export async function saveOrder(offer, buyerPod, sellerPod, buyerWebId, sellerWebId, brokerWebId) {
    const offerUUID = `${sellerPod}private/tests/my-offerings.ttl#${uuid()}`;
    const orderUUID = `${sellerPod}private/tests/my-offerings.ttl#${uuid()}`;
    const orderDate = new Date().toISOString();

    const insertOrderQuery = `
    PREFIX schema: <http://schema.org/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    INSERT { GRAPH <http://mu.semte.ch/application> {
        ?offer a schema:Offer;
            schema:name ${sparqlEscapeString(offer.name.value)};
            schema:description ${sparqlEscapeString(offer.description.value)};
            schema:price ${constructTermToString(offer.currencyValue)};
            schema:priceCurrency ${sparqlEscapeString(offer.currency.value)};
            schema:seller ${sparqlEscapeUri(sellerWebId)}.
        ?order a schema:Order;
            schema:acceptedOffer ?offer;
            schema:orderStatus <http://schema.org/OrderPaymentDue>;
            schema:seller ${sparqlEscapeUri(sellerWebId)};
            schema:customer ${sparqlEscapeUri(buyerWebId)};
            schema:broker ${sparqlEscapeUri(brokerWebId)};
            schema:orderDate ${sparqlEscapeString(orderDate)};
            ext:sellerPod ${sparqlEscapeString(sellerPod)};
            ext:buyerPod ${sparqlEscapeString(buyerPod)}.
    } }
    WHERE {
        BIND(IRI("${offerUUID}") AS ?offer)
        BIND(IRI("${orderUUID}") AS ?order)
    }`;

    try {
        await update(insertOrderQuery);

        await sendSavedOrderTask(orderUUID);
    } catch (e) {
        console.error(e);
        return null;
    }

    return {offerUUID, orderUUID};
}

export async function updateOrder(buyerPod, sellerPod, orderUUID) {

    await sendUpdatedOrderTask(orderUUID);

    return true;
}
