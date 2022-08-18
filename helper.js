import {sparqlEscapeString, sparqlEscapeUri} from 'mu';

export function objectToString(object) {
    if (object.termType === 'NamedNode') {
        return `${sparqlEscapeUri(object.value)}`;
    } else if (object.termType === 'BlankNode') {
        return `_:${object.value}`;
    } else if (object.termType === 'Literal') {
        if ('dataType' in object) {
            return `${sparqlEscapeString(object.value)}^^${sparqlEscapeUri(object.dataType.value)}`;
        } else if ('datatype' in object) {
            return `${sparqlEscapeString(object.value)}^^${sparqlEscapeUri(object.datatype.value)}`;
        } else {
            return `${sparqlEscapeString(object.value)}`;
        }
    } else if (object.type === 'typed-literal') {
        return objectToString({value: object.value, termType: 'Literal', datatype: {value: object.datatype}});
    } else {
        throw new Error(`Unknown term type ${object.termType}`);
    }
}

export function ensureTrailingSlash(url) {
    return url.endsWith('/') ? url : url + '/';
}
