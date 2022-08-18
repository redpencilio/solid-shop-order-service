import {sparqlEscapeString, sparqlEscapeUri} from 'mu';

export function constructTermToString(term) {
    if (term.type === 'uri') {
        return sparqlEscapeUri(term.value);
    } else if (term.type === 'literal') {
        if ('xml:lang' in term) {
            return `${sparqlEscapeString(term.value)}@${term['xml:lang']}`;
        } else if ('datatype' in term) {
            return `${sparqlEscapeString(term.value.toString())}^^${sparqlEscapeUri(term.datatype)}`;
        } else {
            return sparqlEscapeString(term.value);
        }
    } else if (term.type === 'bnode') {
        return `_:${term.value}`;
    } else if (term.type === 'string') {
        // this is not as per https://www.w3.org/TR/2013/REC-sparql11-results-json-20130321/#select-encode-terms
        return sparqlEscapeString(term.value);
    } else {
        throw new Error(`Unknown term type ${term.type}`);
    }
}

export function ensureTrailingSlash(url) {
    return url.endsWith('/') ? url : url + '/';
}
